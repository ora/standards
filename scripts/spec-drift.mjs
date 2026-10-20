#!/usr/bin/env node
/*
 * spec-drift - watch the specs a project describes for changes nobody has
 * reviewed yet.
 *
 * Every watched spec has one or more SOURCES, each with a PIN: the exact
 * state someone last reviewed (a Git object SHA, a revision name, a draft
 * number, or a digest of a page's text). `check` resolves each source's live
 * state and compares it with the pin. A spec whose live state differs from
 * its pin has DRIFTED: it changed since its last review. Moving a pin is the
 * record that someone reviewed the change.
 *
 * This file is shared, byte for byte, by ora/standards (ax.guide) and
 * eralabs-ai/ora (the Ora ranker). Ora's weekly watcher compares the two
 * copies, so change both together.
 *
 * Usage:
 *   node scripts/spec-drift.mjs check <manifest.json> [--only <id>] [--out <report.json>]
 *       Resolve every source and print pin vs live. Exits 1 when a source
 *       could not be resolved (the report still lists the rest).
 *   node scripts/spec-drift.mjs issues <report.json> --repo <owner/name> [--label <label>]
 *         [--status-in <status.json>] [--status-out <status.json>]
 *       Open or refresh one issue per drifted spec and close the issue of a
 *       spec whose pins all match again. Needs the gh CLI and GH_TOKEN.
 *       --status-out writes a small public summary (which specs changed, and
 *       the issue that tracks each).
 *   node scripts/spec-drift.mjs lockstep <manifest.json> <peer-pins.json> [--report <report.json>]
 *         [--peer-script <spec-drift.mjs>] [--out <report.json>]
 *       Compare this repo's pins with the peer's published pins for every
 *       spec both watch, and this script with the peer's copy.
 *   node scripts/spec-drift.mjs page-text <file.html|https-url>
 *   node scripts/spec-drift.mjs page-digest <file.html|https-url>
 *       Print a page's normalized text, or its digest (the pin of a `page`
 *       source). Diff the text of two versions to see what changed.
 *
 * Manifest (JSON):
 *   {
 *     "issue": { "title": "...", "impact": "...", "todo": "..." },   // defaults; {id} {name} {version} {page} are filled in
 *     "standards": [
 *       { "id": "webmcp", "name": "WebMCP", "version": "...", "read_on": "YYYY-MM-DD",
 *         "page": "https://...", "peer": "<id in the peer's pins>",
 *         "issue": { ...per-spec overrides },
 *         "sources": [ { "kind": "git-path", "repo": "owner/name", "path": "index.bs",
 *                        "pin": "<sha>" | { "file": "src/x.ts", "constant": "X_PIN" } } ] }
 *     ]
 *   }
 *
 * Source kinds:
 *   git-path       { repo, path }    Git object SHA of <path> on the default branch (a file's blob or a folder's tree)
 *   git-head       { repo }          the default branch's head commit (any change anywhere in the repository)
 *   git-dated-dirs { repo, path }    the newest YYYY-MM-DD folder under <path> (a newer dated revision)
 *   git-latest-tag { repo, match }   the newest tag matching the regular expression <match>, by version order
 *   ietf-draft     { name }          the IETF draft's latest revision ("01"), plus its state when it is no longer
 *                                    Active ("01 Expired"), so a draft that expires or is replaced drifts too
 *   page           { url }           SHA-256 of the page's normalized <article> (or <main>) text
 *
 * Upstream content is untrusted. Git and HTTP results are only ever matched
 * against strict shapes (hex SHAs, dated names, the manifest's own tag
 * pattern, two-digit revisions); page bodies never leave this process except
 * as a digest. Commands run through execFileSync with argument arrays, never
 * a shell.
 */

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const USER_AGENT = "OraBot/1.0 (+https://ora.ai/bot)";
const FETCH_TIMEOUT_MS = 30_000;
const MAX_PAGE_BYTES = 5_000_000;
const REPO = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const SHA = /^[0-9a-f]{40}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const KINDS = ["git-path", "git-head", "git-dated-dirs", "git-latest-tag", "ietf-draft", "page"];

// ---------------------------------------------------------------- page text

const NAMED_ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

function decodeEntities(text) {
  return text.replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi, (match, ref) => {
    if (ref[0] === "#") {
      const code = ref[1] === "x" || ref[1] === "X" ? parseInt(ref.slice(2), 16) : parseInt(ref.slice(1), 10);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
    }
    return NAMED_ENTITIES[ref.toLowerCase()] ?? match;
  });
}

function extractContent(html) {
  for (const tag of ["article", "main"]) {
    const m = html.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*)</${tag}>`, "i"));
    if (m) return m[1];
  }
  return null;
}

/**
 * A page's text without markup: the <article> element (else <main>), minus
 * comments, scripts and styles, every tag replaced with a space, basic
 * entities decoded, whitespace collapsed. Hashing the article rather than the
 * whole response keeps build ids, asset hashes and navigation out of the pin.
 * Returns null when the page has neither element.
 */
export function normalizePage(html) {
  const content = extractContent(html);
  if (content === null) return null;
  const stripped = content
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ");
  return decodeEntities(stripped).replace(/\s+/g, " ").trim();
}

export function pageDigest(html) {
  const text = normalizePage(html);
  if (!text) return null;
  return createHash("sha256").update(text, "utf8").digest("hex");
}

// ---------------------------------------------------------------- manifest

function fill(template, standard) {
  return String(template ?? "").replace(/\{(id|name|version|page|read_on)\}/g, (_, key) => standard[key] ?? "");
}

/** Where a source lives, as one comparable string: the same key in two manifests means the same thing is watched. */
export function sourceKey(source) {
  switch (source.kind) {
    case "git-path":
    case "git-dated-dirs":
      return `${source.kind} ${source.repo} ${source.path}`;
    case "git-head":
      return `${source.kind} ${source.repo}`;
    case "git-latest-tag":
      return `${source.kind} ${source.repo} ${source.match}`;
    case "ietf-draft":
      return `${source.kind} ${source.name}`;
    case "page":
      return `${source.kind} ${source.url}`;
    default:
      return `${source.kind}`;
  }
}

/** Check a manifest's shape. Returns a list of problems (empty when valid). */
export function validateManifest(manifest) {
  const problems = [];
  if (!manifest || !Array.isArray(manifest.standards)) return ["the manifest has no `standards` list"];
  const ids = new Set();
  for (const s of manifest.standards) {
    const where = `standard "${s?.id}"`;
    if (typeof s?.id !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s.id)) problems.push(`${where}: id must be lowercase words and hyphens`);
    if (ids.has(s?.id)) problems.push(`${where}: listed twice`);
    ids.add(s?.id);
    if (typeof s?.name !== "string" || !s.name) problems.push(`${where}: needs a name`);
    if (!Array.isArray(s?.sources) || s.sources.length === 0) {
      problems.push(`${where}: needs at least one source`);
      continue;
    }
    const keys = new Set();
    for (const src of s.sources) {
      const key = sourceKey(src ?? {});
      if (keys.has(key)) problems.push(`${where}: source "${key}" listed twice`);
      keys.add(key);
      problems.push(...validateSource(src ?? {}).map((p) => `${where}, source "${key}": ${p}`));
    }
  }
  return problems;
}

function validateSource(src) {
  const problems = [];
  if (!KINDS.includes(src.kind)) return [`unknown kind (use one of ${KINDS.join(", ")})`];
  if (src.kind.startsWith("git-") && !REPO.test(src.repo ?? "")) problems.push("repo must be owner/name");
  if ((src.kind === "git-path" || src.kind === "git-dated-dirs") && !/^[^-\s][^\s]*$/.test(src.path ?? "")) problems.push("needs a path");
  if (src.kind === "git-latest-tag") {
    try {
      new RegExp(src.match);
    } catch {
      problems.push("match must be a regular expression");
    }
    if (typeof src.match !== "string" || !src.match.startsWith("^") || !src.match.endsWith("$")) problems.push("match must be anchored with ^ and $");
  }
  if (src.kind === "ietf-draft" && !/^draft-[a-z0-9-]+$/.test(src.name ?? "")) problems.push("name must be a draft name such as draft-ietf-x-y");
  if (src.kind === "page" && !/^https:\/\//.test(src.url ?? "")) problems.push("url must be https");
  const pin = src.pin;
  if (typeof pin === "string") {
    if (!pin) problems.push("pin is empty");
  } else if (!pin || typeof pin.file !== "string" || !/^[A-Z][A-Z0-9_]*$/.test(pin.constant ?? "")) {
    problems.push('pin must be a string or { "file", "constant" }');
  }
  return problems;
}

/** A pin written in the manifest, or read from a `CONSTANT = "value"` line in a source file. */
export function resolvePin(pin, root = process.cwd()) {
  if (typeof pin === "string") return pin;
  const text = readFileSync(join(root, pin.file), "utf8");
  const m = new RegExp(`\\b${pin.constant}\\s*=\\s*"([^"]+)"`).exec(text);
  if (!m) throw new Error(`${pin.constant} not found in ${pin.file}`);
  return m[1];
}

/** The shape a pin of this kind must have; a pin that fails it is a broken manifest, not drift. */
export function pinShapeOk(kind, value) {
  switch (kind) {
    case "git-path":
    case "git-head":
      return SHA.test(value);
    case "git-dated-dirs":
      return DATE.test(value);
    case "ietf-draft":
      return /^\d{2}(?: [A-Za-z][A-Za-z ()-]{0,40})?$/.test(value);
    case "page":
      return /^[0-9a-f]{64}$/.test(value);
    default:
      return value.length > 0 && value.length <= 100;
  }
}

// ---------------------------------------------------------------- live state

function run(cmd, args, opts = {}) {
  return execFileSync(cmd, args, {
    encoding: "utf8",
    timeout: 180_000,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
    ...opts,
  });
}

/** Compare version strings by their numeric runs, so v0.10 sorts after v0.9 and dated tags sort by date. */
export function compareVersions(a, b) {
  const pa = a.match(/\d+|\D+/g) ?? [];
  const pb = b.match(/\d+|\D+/g) ?? [];
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] ?? "";
    const y = pb[i] ?? "";
    if (x === y) continue;
    const nx = /^\d+$/.test(x);
    const ny = /^\d+$/.test(y);
    if (nx && ny) return Number(x) - Number(y);
    return x < y ? -1 : 1;
  }
  return 0;
}

async function fetchText(url, maxBytes = MAX_PAGE_BYTES) {
  const res = await fetch(url, {
    headers: { "user-agent": USER_AGENT },
    redirect: "follow",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  if (!res.url.startsWith("https://")) throw new Error(`${url} redirected off https`);
  const body = await res.text();
  if (body.length > maxBytes) throw new Error(`${url} is larger than ${maxBytes} bytes`);
  return { body, landed: res.url };
}

class Live {
  constructor() {
    this.dir = mkdtempSync(join(tmpdir(), "spec-drift-"));
    this.clones = new Map();
  }

  close() {
    rmSync(this.dir, { recursive: true, force: true });
  }

  /** A shallow clone of the default branch with trees but no file contents: enough for object SHAs and listings. */
  clone(repo) {
    let dir = this.clones.get(repo);
    if (!dir) {
      dir = join(this.dir, repo.replace("/", "__"));
      run("git", ["clone", "--quiet", "--depth", "1", "--filter=blob:none", "--no-checkout", "--", `https://github.com/${repo}`, dir]);
      this.clones.set(repo, dir);
    }
    return dir;
  }

  /** The live state of one source: { value, note?, link? }. Throws when it cannot be read. */
  async resolve(src) {
    switch (src.kind) {
      case "git-path": {
        const dir = this.clone(src.repo);
        let value;
        try {
          value = run("git", ["-C", dir, "rev-parse", "--verify", "--quiet", `HEAD:${src.path}`]).trim();
        } catch {
          throw new Error(`${src.path} does not exist in ${src.repo}`);
        }
        return { value, link: `https://github.com/${src.repo}/commits/HEAD/${src.path}` };
      }
      case "git-head": {
        const line = run("git", ["ls-remote", "--", `https://github.com/${src.repo}`, "HEAD"]).trim();
        const value = line.split(/\s+/)[0] ?? "";
        return { value };
      }
      case "git-dated-dirs": {
        const dir = this.clone(src.repo);
        const names = run("git", ["-C", dir, "ls-tree", "-d", "--name-only", "HEAD", `${src.path}/`])
          .split("\n")
          .map((line) => line.trim().split("/").pop() ?? "")
          .filter((name) => DATE.test(name))
          .sort();
        const value = names.at(-1);
        if (!value) throw new Error(`no dated folders under ${src.path} in ${src.repo}`);
        return { value, link: `https://github.com/${src.repo}/tree/HEAD/${src.path}/${value}` };
      }
      case "git-latest-tag": {
        const match = new RegExp(src.match);
        const tags = run("git", ["ls-remote", "--tags", "--refs", "--", `https://github.com/${src.repo}`])
          .split("\n")
          .map((line) => line.split("refs/tags/")[1]?.trim() ?? "")
          .filter((tag) => tag && match.test(tag))
          .sort(compareVersions);
        const value = tags.at(-1);
        if (!value) throw new Error(`no tag in ${src.repo} matches ${src.match}`);
        return { value, link: `https://github.com/${src.repo}/releases/tag/${value}` };
      }
      case "ietf-draft": {
        const { body } = await fetchText(`https://datatracker.ietf.org/doc/${src.name}/doc.json`, 2_000_000);
        const doc = JSON.parse(body);
        const rev = String(doc.rev ?? "");
        const state = String(doc.state ?? "");
        if (!/^\d{2}$/.test(rev)) throw new Error(`datatracker gave no revision for ${src.name}`);
        if (!/^[A-Za-z][A-Za-z ()-]{0,40}$/.test(state)) throw new Error(`datatracker gave no state for ${src.name}`);
        return {
          value: state === "Active" ? rev : `${rev} ${state}`,
          link: `https://datatracker.ietf.org/doc/${src.name}/${rev}/`,
        };
      }
      case "page": {
        const { body, landed } = await fetchText(src.url);
        const value = pageDigest(body);
        if (!value) throw new Error(`no <article> or <main> text at ${src.url}`);
        return { value, link: src.url, note: landed !== src.url ? `served from ${landed}` : undefined };
      }
      default:
        throw new Error(`unknown kind ${src.kind}`);
    }
  }
}

/** Where to read what changed between the pin and the live state. */
function changeLink(src, pin, live) {
  if (src.kind === "git-head") return `https://github.com/${src.repo}/compare/${pin}...${live.value}`;
  if (src.kind === "git-latest-tag") return `https://github.com/${src.repo}/compare/${pin}...${live.value}`;
  const pinRev = pin.slice(0, 2);
  const liveRev = live.value.slice(0, 2);
  if (src.kind === "ietf-draft" && pinRev !== liveRev) {
    return `https://author-tools.ietf.org/iddiff?url1=${src.name}-${pinRev}&url2=${src.name}-${liveRev}`;
  }
  return live.link;
}

function short(value) {
  return SHA.test(value) || /^[0-9a-f]{64}$/.test(value) ? value.slice(0, 12) : value;
}

function describeSource(src) {
  switch (src.kind) {
    case "git-path":
      return `\`${src.path}\` in ${src.repo}`;
    case "git-head":
      return `${src.repo} (whole repository)`;
    case "git-dated-dirs":
      return `newest dated revision under \`${src.path}\` in ${src.repo}`;
    case "git-latest-tag":
      return `newest ${src.repo} release tag`;
    case "ietf-draft":
      return `IETF ${src.name}`;
    case "page":
      return src.url;
    default:
      return src.kind;
  }
}

// ---------------------------------------------------------------- check

async function check(manifestPath, { only, out }) {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const problems = validateManifest(manifest);
  if (problems.length) {
    console.error(`${manifestPath} is not valid:\n- ${problems.join("\n- ")}`);
    process.exit(2);
  }
  const live = new Live();
  const entries = [];
  try {
    for (const standard of manifest.standards) {
      if (only && standard.id !== only) continue;
      const sources = [];
      for (const src of standard.sources) {
        const row = { key: sourceKey(src), label: describeSource(src), kind: src.kind };
        try {
          row.pin = resolvePin(src.pin);
          if (!pinShapeOk(src.kind, row.pin)) throw new Error(`the pin "${row.pin}" is not a valid ${src.kind} pin`);
          const state = await live.resolve(src);
          if (!pinShapeOk(src.kind, state.value)) throw new Error(`unexpected live value "${state.value}"`);
          row.live = state.value;
          row.changed = state.value !== row.pin;
          if (state.note) row.note = state.note;
          row.link = changeLink(src, row.pin, state);
        } catch (error) {
          row.error = error instanceof Error ? error.message.split("\n")[0] : String(error);
        }
        sources.push(row);
        const status = row.error ? `ERROR ${row.error}` : row.changed ? `CHANGED live ${row.live} (reviewed pin ${short(row.pin)})` : "ok";
        console.log(`${standard.id.padEnd(16)} ${row.key.padEnd(72)} ${status}`);
      }
      const state = sources.some((s) => s.error) ? "error" : sources.some((s) => s.changed) ? "drift" : "clean";
      entries.push({ id: standard.id, name: standard.name, state, title: issueTitle(manifest, standard), body: issueBody(manifest, standard, sources), sources });
    }
  } finally {
    live.close();
  }
  if (out) writeFileSync(out, `${JSON.stringify({ entries }, null, 2)}\n`);
  if (entries.some((e) => e.state === "error")) process.exitCode = 1;
}

function issueTitle(manifest, standard) {
  return fill(standard.issue?.title ?? manifest.issue?.title ?? "{name} spec changed since its last review", standard);
}

function issueBody(manifest, standard, sources) {
  const impact = fill(standard.issue?.impact ?? manifest.issue?.impact ?? "", standard);
  const todo = fill(standard.issue?.todo ?? manifest.issue?.todo ?? "Review the change, then move the pins.", standard);
  const moved = sources
    .filter((s) => s.changed)
    .map((s) => {
      const note = s.note ? `; ${s.note}` : "";
      const link = s.link ? ` ([${s.kind === "page" ? "read the page" : "what changed"}](${s.link}))` : "";
      return `- ${s.label}: live \`${s.live}\` vs reviewed pin \`${short(s.pin)}\`${note}${link}`;
    });
  return [
    "## Motivation",
    "",
    `The ${standard.name} spec changed since someone last reviewed it: ${moved.length} of its ${sources.length} watched source(s) no longer match their reviewed pins. ${impact}`.trim(),
    "",
    "## Objective",
    "",
    todo,
    "",
    "### What moved",
    "",
    ...moved,
    "",
    "---",
    "_Maintained by the weekly spec drift watch (`scripts/spec-drift.mjs`): refreshed on each run, closed automatically once every pin matches._",
    "",
  ].join("\n");
}

// ---------------------------------------------------------------- issues

function gh(args, opts) {
  return run("gh", args, opts);
}

function issues(reportPath, { repo, label = "spec-drift", statusIn, statusOut }) {
  if (!REPO.test(repo ?? "")) throw new Error("--repo owner/name is required");
  const { entries } = JSON.parse(readFileSync(reportPath, "utf8"));
  const open = JSON.parse(gh(["issue", "list", "--repo", repo, "--label", label, "--state", "open", "--limit", "200", "--json", "number,title,url,createdAt"]));
  const previous = statusIn ? readStatus(statusIn) : {};
  const status = {};
  const bodyDir = mkdtempSync(join(tmpdir(), "spec-drift-issue-"));
  let labelReady = false;
  try {
    for (const entry of entries) {
      const existing = open.find((issue) => issue.title === entry.title);
      if (entry.state === "drift") {
        const bodyFile = join(bodyDir, `${entry.id}.md`);
        writeFileSync(bodyFile, entry.body);
        if (existing) {
          gh(["issue", "edit", String(existing.number), "--repo", repo, "--body-file", bodyFile]);
          status[entry.id] = { changed: true, issue: existing.url, since: existing.createdAt.slice(0, 10) };
          console.log(`refreshed ${existing.url}`);
        } else {
          if (!labelReady) {
            try {
              gh(["label", "create", label, "--repo", repo, "--color", "D93F0B", "--description", "A watched spec changed since its last review"]);
            } catch {
              // Expected when the label already exists; issue create below fails loudly if it truly cannot be used.
            }
            labelReady = true;
          }
          const url = gh(["issue", "create", "--repo", repo, "--title", entry.title, "--label", label, "--body-file", bodyFile]).trim();
          status[entry.id] = { changed: true, issue: url, since: new Date().toISOString().slice(0, 10) };
          console.log(`opened ${url}`);
        }
      } else if (entry.state === "clean") {
        if (existing) {
          gh(["issue", "close", String(existing.number), "--repo", repo, "--comment", "Every watched source matches its reviewed pin again - closing."]);
          console.log(`closed ${existing.url}`);
        }
        status[entry.id] = { changed: false };
      } else {
        // A source could not be read: neither open nor close anything, and keep what was last known.
        if (previous[entry.id]) status[entry.id] = previous[entry.id];
        console.log(`left ${entry.id} alone: a source could not be read`);
      }
    }
  } finally {
    rmSync(bodyDir, { recursive: true, force: true });
  }
  if (statusOut) {
    const standards = Object.fromEntries(Object.entries(status).sort(([a], [b]) => a.localeCompare(b)));
    writeFileSync(statusOut, `${JSON.stringify({ standards }, null, 2)}\n`);
  }
}

function readStatus(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8")).standards ?? {};
  } catch (error) {
    // A first run has no earlier status; anything else is a real failure.
    if (error && error.code === "ENOENT") return {};
    throw error;
  }
}

// ---------------------------------------------------------------- lockstep

/**
 * Compare this repo's pins with a peer's for every spec both watch. Each of
 * this manifest's standards names the peer's entry in `peer`; a standard with
 * `"peer": null` is watched here only. Every peer standard must be claimed by
 * one of ours, so a spec the peer starts watching shows up here too.
 */
export function compareWithPeer(manifest, peerPins, { live = new Map(), sameScript = true, peerName = "the peer" } = {}) {
  const problems = [];
  const peerById = new Map(peerPins.standards.map((s) => [s.id, s]));
  const claimed = new Set();
  for (const standard of manifest.standards) {
    if (standard.peer === null) continue;
    const peerId = standard.peer ?? standard.id;
    const peer = peerById.get(peerId);
    if (!peer) {
      problems.push(`**${standard.name}**: ${peerName} has no \`${peerId}\` entry. Add it there, or set \`"peer": null\` here if only this repo should watch it.`);
      continue;
    }
    claimed.add(peerId);
    const peerSources = new Map(peer.sources.map((s) => [sourceKey(s), s]));
    for (const src of standard.sources) {
      const key = sourceKey(src);
      const theirs = peerSources.get(key);
      if (!theirs) {
        problems.push(`**${standard.name}**: ${peerName} does not watch ${describeSource(src)}.`);
        continue;
      }
      const ours = resolvePin(src.pin);
      if (ours !== theirs.pin) {
        const now = live.get(`${standard.id} ${key}`);
        const behind = now === undefined ? "" : now === ours ? ` ${peerName} is behind the live spec.` : now === theirs.pin ? " This repo is behind the live spec." : " Neither matches the live spec.";
        problems.push(`**${standard.name}**, ${describeSource(src)}: this repo pins \`${short(ours)}\`, ${peerName} pins \`${short(theirs.pin)}\`.${behind}`);
      }
    }
  }
  for (const peer of peerPins.standards) {
    if (!claimed.has(peer.id)) problems.push(`**${peer.name}**: ${peerName} watches it, but no standard here names \`${peer.id}\` as its peer.`);
  }
  if (!sameScript) problems.push(`\`scripts/spec-drift.mjs\` differs from ${peerName}'s copy. The two must stay identical.`);
  return problems;
}

function lockstep(manifestPath, peerPath, { report, peerScript, out }) {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const peerPins = JSON.parse(readFileSync(peerPath, "utf8"));
  const problems = [...validateManifest(manifest), ...validateManifest(peerPins).map((p) => `peer pins: ${p}`)];
  const lockstepIssue = manifest.lockstep ?? {};
  const peerName = lockstepIssue.peer_name ?? "the peer";
  if (problems.length === 0) {
    const live = new Map();
    if (report) {
      for (const entry of JSON.parse(readFileSync(report, "utf8")).entries) {
        for (const s of entry.sources) if (s.live) live.set(`${entry.id} ${s.key}`, s.live);
      }
    }
    const sameScript = peerScript ? readFileSync(peerScript, "utf8") === readFileSync(fileURLToPath(import.meta.url), "utf8") : true;
    problems.push(...compareWithPeer(manifest, peerPins, { live, sameScript, peerName }));
  }
  for (const p of problems) console.log(`- ${p}`);
  if (problems.length === 0) console.log(`pins agree with ${peerName}`);
  const entry = {
    id: "lockstep",
    name: peerName,
    state: problems.length ? "drift" : "clean",
    title: lockstepIssue.title ?? `Spec pins disagree with ${peerName}`,
    body: [
      "## Motivation",
      "",
      `This repo and ${peerName} describe the same specs, and each records the exact state it last reviewed. They disagree on the points below, so one of them describes a spec state the other has moved past.`,
      "",
      "## Objective",
      "",
      lockstepIssue.todo ?? "Bring the two sets of pins together: review the spec where one side is behind, then move that side's pins.",
      "",
      "### Disagreements",
      "",
      ...problems.map((p) => `- ${p}`),
      "",
      "---",
      "_Maintained by the weekly spec drift watch (`scripts/spec-drift.mjs lockstep`): refreshed on each run, closed automatically once the pins agree._",
      "",
    ].join("\n"),
    sources: [],
  };
  if (out) writeFileSync(out, `${JSON.stringify({ entries: [entry] }, null, 2)}\n`);
}

// ---------------------------------------------------------------- cli

function option(args, name) {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
}

async function readPage(target) {
  if (/^https:\/\//.test(target)) return (await fetchText(target)).body;
  return readFileSync(target, "utf8");
}

async function main(argv) {
  const [command, ...args] = argv;
  switch (command) {
    case "check":
      return check(args[0], { only: option(args, "--only"), out: option(args, "--out") });
    case "issues":
      return issues(args[0], {
        repo: option(args, "--repo"),
        label: option(args, "--label"),
        statusIn: option(args, "--status-in"),
        statusOut: option(args, "--status-out"),
      });
    case "lockstep":
      return lockstep(args[0], args[1], { report: option(args, "--report"), peerScript: option(args, "--peer-script"), out: option(args, "--out") });
    case "page-text":
    case "page-digest": {
      const html = await readPage(args[0]);
      const text = normalizePage(html);
      // No <article> and no <main> means the page shape changed; fail loudly instead of pinning an empty digest.
      if (!text) {
        console.error(`no <article> or <main> content in ${args[0]}`);
        process.exit(1);
      }
      console.log(command === "page-text" ? text : pageDigest(html));
      return;
    }
    default:
      console.error("usage: spec-drift.mjs check|issues|lockstep|page-text|page-digest ... (see the comment at the top of this file)");
      process.exit(2);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
