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
 * This file is shared, byte for byte, by ora/standards (ax.guide),
 * eralabs-ai/ora (the Ora ranker) and ora/poppy-ax (poppy.ax). Ora's and
 * poppy.ax's weekly watchers compare their copy with ax.guide's, so change all
 * three together, ax.guide first.
 *
 * Usage:
 *   node scripts/spec-drift.mjs check <manifest.json> [--only <id>] [--out <report.json>]
 *       Resolve every source and print pin vs live. Exits 1 when a source
 *       could not be resolved (the report still lists the rest).
 *   node scripts/spec-drift.mjs issues <report.json> --repo <owner/name> [--label <label>]
 *         [--status-in <status.json>] [--status-out <status.json>] [--opened-out <opened.json>]
 *         [--escalate-after <days> --escalate-label <label> [--escalate-mention <@handle>]]
 *       Open or refresh one issue per drifted spec and close the issue of a
 *       spec whose pins all match again. Needs the gh CLI and GH_TOKEN.
 *       --status-out writes a small public summary (which specs changed, and
 *       the issue that tracks each); --opened-out lists the issues this run
 *       opened, so the workflow can start the fix agent for each. An issue
 *       still open after --escalate-after days gets the escalate label and
 *       one comment.
 *   node scripts/spec-drift.mjs context <manifest.json> --title-file <title.txt> --out <dir>
 *       For the fix workflow: find the drifted spec whose issue has this title
 *       and write what changed into <dir> (Git diffs between the pin and the
 *       live state, both IETF revisions, a page's text, a JSON document), so
 *       the agent that drafts a fix needs no network. Exits 1 when no drifted
 *       spec has that title.
 *   node scripts/spec-drift.mjs vet-patch <patch> --allow <regex> [--pins-only <regex>] [--plain <regex>]
 *       For the fix workflow: refuse a patch that touches a path outside
 *       --allow, adds a binary, symlink, rename or mode change, changes a
 *       --pins-only file anywhere but its `export const X = "..."` lines, or
 *       adds markup or code (`<`, `{`, `}`, import or export lines) to a
 *       --plain file, such as MDX that a site build would run.
 *   node scripts/spec-drift.mjs health --failed <true|false> --run-url <url> --out <report.json>
 *       A one-entry report for the watcher's own health: `issues` then opens
 *       an issue when a run failed and closes it after the next good run.
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
 *     "issue": { "title": "...", "impact": "...", "todo": "..." },   // defaults; {id} {name} {page} are filled in
 *     "standards": [
 *       { "id": "webmcp", "name": "WebMCP", "page": "https://...", "peer": "<id in the peer's pins>",
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
 *   json-field     { url, field }    a string field of a JSON document, by dotted path (another
 *                                    project's published spec label, such as Ora's PAP catalog `profile`)
 *
 * Upstream content is untrusted. Git and HTTP results are only ever matched
 * against strict shapes (hex SHAs, dated names, the manifest's own tag
 * pattern, two-digit revisions); page bodies never leave this process except
 * as a digest. Commands run through execFileSync with argument arrays, never
 * a shell.
 */

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const USER_AGENT = "OraBot/1.0 (+https://ora.ai/bot)";
const FETCH_TIMEOUT_MS = 30_000;
const MAX_PAGE_BYTES = 5_000_000;
const REPO = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const SHA = /^[0-9a-f]{40}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
// A release tag that may appear in an issue: Git allows backticks and brackets in ref names, so the manifest's own `match` is not enough.
const TAG = /^[A-Za-z0-9._+/-]{1,100}$/;
// The path part of a redirect target shown in an issue ("served from /docs/0.2/spec").
const SAFE_PATH = /^\/[A-Za-z0-9._~/-]{0,200}$/;
const KINDS = ["git-path", "git-head", "git-dated-dirs", "git-latest-tag", "ietf-draft", "page", "json-field"];
// A json-field value that may appear in an issue: a label such as "pap-0.2@2026-10-19", nothing that is markup.
const LABEL = /^[A-Za-z0-9._@:+/-]{1,100}$/;
const FIELD_PATH = /^[A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)*$/;
const RUN_URL = /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/actions\/runs\/\d+$/;
const DAY_MS = 86_400_000;

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

/** The index just past the first "<tag" at or after `from` that ends at a word boundary, or -1. Case-insensitive. */
function findOpen(html, tag, from) {
  const re = new RegExp(`<${tag}\\b`, "gi");
  re.lastIndex = from;
  const m = re.exec(html);
  return m ? m.index : -1;
}

/** The start of the last "</tag>" in `html`, or -1. Case-insensitive. */
function findLastClose(html, tag) {
  const re = new RegExp(`</${tag}>`, "gi");
  let last = -1;
  for (let m = re.exec(html); m; m = re.exec(html)) last = m.index;
  return last;
}

// Each scanner below gives exactly what its regular expression gives
// (`<tag\b[^>]*>([\s\S]*)</tag>`, `<!--[\s\S]*?-->`, ...) but in linear time:
// the regexes rescan to the end of the page from every unclosed opener, which
// a crafted page can make quadratic. Same output, so existing pins stay valid.

function extractContent(html) {
  for (const tag of ["article", "main"]) {
    const open = findOpen(html, tag, 0);
    if (open === -1) continue;
    const openEnd = html.indexOf(">", open);
    const close = findLastClose(html, tag);
    // A later opener ends later still, so if the first cannot fit before the last close, none can.
    if (openEnd === -1 || close === -1 || openEnd + 1 > close) continue;
    return html.slice(openEnd + 1, close);
  }
  return null;
}

/** Replace every `start ... end` run (shortest, left to right) with a space; an unclosed start is left as text. */
function replaceRuns(text, startRe, end) {
  const endRe = new RegExp(end.replace(/[/]/g, "\\/"), "gi");
  let out = "";
  let pos = 0;
  startRe.lastIndex = 0;
  for (let m = startRe.exec(text); m; m = startRe.exec(text)) {
    endRe.lastIndex = m.index + m[0].length;
    const close = endRe.exec(text);
    // No end after this start means none after any later start either.
    if (!close) break;
    out += `${text.slice(pos, m.index)} `;
    pos = close.index + close[0].length;
    startRe.lastIndex = pos;
  }
  return out + text.slice(pos);
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
  let stripped = replaceRuns(content, /<!--/g, "-->");
  stripped = replaceRuns(stripped, /<script\b/gi, "</script>");
  stripped = replaceRuns(stripped, /<style\b/gi, "</style>");
  stripped = replaceRuns(stripped, /</g, ">");
  return decodeEntities(stripped).replace(/\s+/g, " ").trim();
}

export function pageDigest(html) {
  const text = normalizePage(html);
  if (!text) return null;
  return createHash("sha256").update(text, "utf8").digest("hex");
}

// ---------------------------------------------------------------- manifest

function fill(template, standard) {
  return String(template ?? "").replace(/\{(id|name|page)\}/g, (_, key) => standard[key] ?? "");
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
    case "json-field":
      return `${source.kind} ${source.url} ${source.field}`;
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
  if ((src.kind === "page" || src.kind === "json-field") && !/^https:\/\//.test(src.url ?? "")) problems.push("url must be https");
  if (src.kind === "json-field" && !FIELD_PATH.test(src.field ?? "")) problems.push("field must be a dotted path such as profile or meta.version");
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
    case "git-latest-tag":
      return TAG.test(value);
    case "json-field":
      return LABEL.test(value);
    default:
      return false;
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

const MAX_REDIRECTS = 5;

/**
 * GET a URL as text. Redirects are followed only within the URL's own origin
 * (the PAP pages redirect to their current draft's folder), so a page cannot
 * send the watcher to another host, and the body is read in chunks and cut
 * off at `maxBytes`. `landed` is the URL that finally answered.
 */
async function fetchText(url, maxBytes = MAX_PAGE_BYTES) {
  const origin = new URL(url).origin;
  let current = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const res = await fetch(current, {
      headers: { "user-agent": USER_AGENT },
      redirect: "manual",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    const location = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && location) {
      await res.body?.cancel();
      const next = new URL(location, current);
      if (next.origin !== origin) throw new Error(`${url} redirected to another origin`);
      current = next.href;
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${current}`);
    return { body: await readCapped(res, maxBytes, url), landed: current };
  }
  throw new Error(`${url} redirected more than ${MAX_REDIRECTS} times`);
}

async function readCapped(res, maxBytes, url) {
  const chunks = [];
  let size = 0;
  if (res.body) {
    const reader = res.body.getReader();
    for (let r = await reader.read(); !r.done; r = await reader.read()) {
      size += r.value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new Error(`${url} is larger than ${maxBytes} bytes`);
      }
      chunks.push(r.value);
    }
  }
  return new TextDecoder("utf-8").decode(Buffer.concat(chunks));
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

  /** A clone with the whole history but no file contents until asked: enough to diff a pin against the live state. */
  fullClone(repo) {
    const key = `full:${repo}`;
    let dir = this.clones.get(key);
    if (!dir) {
      dir = join(this.dir, `${repo.replace("/", "__")}-full`);
      run("git", ["clone", "--quiet", "--filter=blob:none", "--no-checkout", "--", `https://github.com/${repo}`, dir]);
      this.clones.set(key, dir);
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
          .filter((tag) => TAG.test(tag) && match.test(tag))
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
        // The redirect target is the page operator's text: show only its path, and only when it is plain.
        const path = new URL(landed).pathname;
        const note = landed === src.url ? undefined : SAFE_PATH.test(path) ? `served from \`${path}\`` : "served from a redirect";
        return { value, link: src.url, note };
      }
      case "json-field": {
        const { body } = await fetchText(src.url, 2_000_000);
        let value = JSON.parse(body);
        for (const key of src.field.split(".")) value = value !== null && typeof value === "object" && Object.hasOwn(value, key) ? value[key] : undefined;
        if (typeof value !== "string") throw new Error(`${src.url} has no string at ${src.field}`);
        return { value, link: src.url };
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
    case "json-field":
      return `\`${src.field}\` in ${src.url}`;
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
          if (!pinShapeOk(src.kind, state.value)) throw new Error(`the live value is not a valid ${src.kind} pin`);
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
    `${standard.name}: ${moved.length} of ${sources.length} watched source(s) changed since someone last reviewed them, so they no longer match their reviewed pins. ${impact}`.trim(),
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

/** Create a label once per run; it usually exists already, and anything else is a real failure. */
function ensureLabel(repo, name, description, color, made) {
  if (made.has(name)) return;
  try {
    gh(["label", "create", name, "--repo", repo, "--color", color, "--description", description]);
  } catch (error) {
    if (!/already exists/i.test(String(error?.stderr ?? ""))) throw error;
  }
  made.add(name);
}

function issues(reportPath, { repo, label = "spec-drift", statusIn, statusOut, openedOut, escalateAfter, escalateLabel, escalateMention }) {
  if (!REPO.test(repo ?? "")) throw new Error("--repo owner/name is required");
  const escalateDays = escalateAfter === undefined ? undefined : Number(escalateAfter);
  if (escalateDays !== undefined && (!Number.isInteger(escalateDays) || escalateDays < 1 || !/^[a-z0-9-]{1,50}$/.test(escalateLabel ?? ""))) {
    throw new Error("--escalate-after needs a whole number of days and --escalate-label a lowercase label");
  }
  if (escalateMention !== undefined && !/^@[A-Za-z0-9-]{1,39}(?:\/[A-Za-z0-9_.-]{1,100})?$/.test(escalateMention)) {
    throw new Error("--escalate-mention must be a GitHub @handle or @org/team");
  }
  const { entries } = JSON.parse(readFileSync(reportPath, "utf8"));
  const open = JSON.parse(gh(["issue", "list", "--repo", repo, "--label", label, "--state", "open", "--limit", "200", "--json", "number,title,url,createdAt,labels"]));
  const previous = statusIn ? readStatus(statusIn) : {};
  const status = {};
  const opened = [];
  const bodyDir = mkdtempSync(join(tmpdir(), "spec-drift-issue-"));
  const labels = new Set();
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
          const age = (Date.now() - Date.parse(existing.createdAt)) / DAY_MS;
          const days = Math.round(age);
          const escalated = (existing.labels ?? []).some((l) => l.name === escalateLabel);
          if (escalateDays !== undefined && isOverdue(age, escalateDays) && !escalated) {
            const who = escalateMention ? `${escalateMention}: ` : "";
            const commentFile = join(bodyDir, `${entry.id}-escalate.md`);
            writeFileSync(
              commentFile,
              `${who}this has been open for ${days} days. Until someone reviews the change and moves the pins, this project describes or scores a version of the spec that is no longer current. If nothing needs to change, moving the pins is enough.\n`,
            );
            // Comment first: if it fails, the label is not set yet and the next run tries again.
            gh(["issue", "comment", String(existing.number), "--repo", repo, "--body-file", commentFile]);
            ensureLabel(repo, escalateLabel, "A spec drift issue nobody has handled in time", "B60205", labels);
            gh(["issue", "edit", String(existing.number), "--repo", repo, "--add-label", escalateLabel]);
            console.log(`escalated ${existing.url} after ${days} days`);
          }
        } else {
          ensureLabel(repo, label, "Opened by the spec drift watch", "D93F0B", labels);
          const url = gh(["issue", "create", "--repo", repo, "--title", entry.title, "--label", label, "--body-file", bodyFile]).trim();
          status[entry.id] = { changed: true, issue: url, since: new Date().toISOString().slice(0, 10) };
          const number = /\/issues\/(\d+)$/.exec(url)?.[1];
          if (number) opened.push({ id: entry.id, number: Number(number), url });
          console.log(`opened ${url}`);
        }
      } else if (entry.state === "clean") {
        if (existing) {
          const comment = entry.close_comment ?? "Every watched source matches its reviewed pin again - closing.";
          gh(["issue", "close", String(existing.number), "--repo", repo, "--comment", comment]);
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
  if (openedOut) writeFileSync(openedOut, `${JSON.stringify(opened, null, 2)}\n`);
}

/**
 * Whether an issue `ageDays` old is due for escalation. Weekly runs drift by
 * minutes against the issue's creation time, so half a day of slack keeps "14
 * days" from becoming 21 when a run starts a little early.
 */
export function isOverdue(ageDays, afterDays) {
  return ageDays >= afterDays - 0.5;
}

/** The watcher's own health as a one-entry report: a failed run opens an issue, the next good run closes it. */
export function healthReport({ failed, runUrl }) {
  if (!RUN_URL.test(runUrl ?? "")) throw new Error("--run-url must be a GitHub Actions run URL");
  return {
    entries: [
      {
        id: "watch-health",
        name: "spec drift watch",
        state: failed ? "drift" : "clean",
        title: "The spec drift watch failed - spec changes may be going unnoticed",
        close_comment: `The latest run succeeded (${runUrl}) - closing.`,
        body: [
          "## Motivation",
          "",
          `The latest spec drift watch run failed (${runUrl}). While it fails, a spec can change without anyone being told.`,
          "",
          "## Objective",
          "",
          "Open the run and see which job failed. Most often a watched source could not be read (a file or folder moved, a repository was renamed, a page changed its layout, or a site was down): fix the source in the manifest and run the watch again. A failed script comparison means this repo's `scripts/spec-drift.mjs` no longer matches ax.guide's copy. This issue closes on the next run that succeeds.",
          "",
          "---",
          "_Maintained by the spec drift watch (`scripts/spec-drift.mjs health`)._",
          "",
        ].join("\n"),
        sources: [],
      },
    ],
  };
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
    const ourKeys = new Set(standard.sources.map(sourceKey));
    for (const theirs of peer.sources) {
      if (!ourKeys.has(sourceKey(theirs))) problems.push(`**${standard.name}**: ${peerName} also watches ${describeSource(theirs)}, and this repo does not.`);
    }
    for (const src of standard.sources) {
      const key = sourceKey(src);
      const theirs = peerSources.get(key);
      if (!theirs) {
        problems.push(`**${standard.name}**: ${peerName} does not watch ${describeSource(src)}.`);
        continue;
      }
      const ours = resolvePin(src.pin);
      if (!pinShapeOk(theirs.kind, theirs.pin)) {
        problems.push(`**${standard.name}**: ${peerName}'s pin for ${describeSource(src)} is not a valid ${src.kind} pin.`);
        continue;
      }
      if (ours !== theirs.pin) {
        const now = live.get(`${standard.id} ${key}`);
        const behind = now === undefined ? "" : now === ours ? ` ${peerName} is behind the live spec.` : now === theirs.pin ? " This repo is behind the live spec." : " Neither matches the live spec.";
        problems.push(`**${standard.name}**, ${describeSource(src)}: this repo pins \`${short(ours)}\`, ${peerName} pins \`${short(theirs.pin)}\`.${behind}`);
      }
    }
  }
  for (const peer of peerPins.standards) {
    // Only the peer's id (already held to the id pattern) reaches the issue, never its free-text name.
    if (!claimed.has(peer.id)) problems.push(`${peerName} watches \`${peer.id}\`, but no standard here names it as its peer.`);
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
    close_comment: `The pins agree with ${peerName} again - closing.`,
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


// ---------------------------------------------------------------- fix workflow

const MAX_CONTEXT_CHARS = 300_000;

function capped(text) {
  return text.length > MAX_CONTEXT_CHARS ? `${text.slice(0, MAX_CONTEXT_CHARS)}\n\n[cut at ${MAX_CONTEXT_CHARS} characters]\n` : text;
}

/** `git` output, or null when git exits non-zero (an object missing from history, a path that is gone). */
function gitOr(dir, args) {
  try {
    return run("git", ["-C", dir, ...args], { maxBuffer: 64 * 1024 * 1024 });
  } catch (error) {
    // git diff --no-index exits 1 when the files differ; its output is still the answer.
    if (error && error.status === 1 && typeof error.stdout === "string" && error.stdout) return error.stdout;
    return null;
  }
}

/** What changed in one moved source, as Markdown with fenced upstream text. */
async function describeChange(live, src, pin, current) {
  const fence = (lang, body) => `\`\`\`\`${lang}\n${body}\n\`\`\`\`\n`;
  const head = `# ${describeSource(src)}\n\nReviewed pin: \`${pin}\`\nLive: \`${current}\`\n\n`;
  switch (src.kind) {
    case "git-path":
    case "git-head":
    case "git-latest-tag": {
      const dir = live.fullClone(src.repo);
      // A blob or tree pin is diffed object to object; a commit or tag pin, commit to commit.
      const log =
        src.kind === "git-path"
          ? gitOr(dir, ["log", "--date=short", "--format=%h %ad %s", "-n", "40", "HEAD", "--", src.path])
          : gitOr(dir, ["log", "--date=short", "--format=%h %ad %s", `${pin}..${current}`]);
      const stat = gitOr(dir, ["diff", "--stat", pin, current]);
      const diff = gitOr(dir, ["diff", pin, current]);
      if (diff === null) {
        const now = src.kind === "git-path" ? gitOr(dir, ["show", `HEAD:${src.path}`]) : null;
        return `${head}The reviewed state is no longer in the repository's history, so there is no diff.\n\n${now ? `Current content:\n\n${fence("", capped(now))}` : ""}`;
      }
      return `${head}Recent commits (untrusted text):\n\n${fence("", log ?? "")}\nChanged files:\n\n${fence("", stat ?? "")}\nDiff:\n\n${fence("diff", capped(diff))}`;
    }
    case "git-dated-dirs": {
      const dir = live.fullClone(src.repo);
      const diff = gitOr(dir, ["diff", `HEAD:${src.path}/${pin}`, `HEAD:${src.path}/${current}`]);
      return `${head}A newer dated revision exists. Diff from the reviewed revision folder to the newest one:\n\n${fence("diff", capped(diff ?? "(no diff available)"))}`;
    }
    case "ietf-draft": {
      const name = src.name;
      const text = async (rev) => (await fetchText(`https://www.ietf.org/archive/id/${name}-${rev}.txt`, 2_000_000)).body;
      const [oldRev, newRev] = [pin.slice(0, 2), current.slice(0, 2)];
      const before = await text(oldRev);
      const after = oldRev === newRev ? before : await text(newRev);
      const work = mkdtempSync(join(tmpdir(), "spec-drift-ietf-"));
      try {
        writeFileSync(join(work, "a.txt"), before);
        writeFileSync(join(work, "b.txt"), after);
        const diff = gitOr(work, ["diff", "--no-index", "a.txt", "b.txt"]) ?? "(the revisions are identical)";
        return `${head}Diff from ${name}-${oldRev} to ${name}-${newRev}:\n\n${fence("diff", capped(diff))}`;
      } finally {
        rmSync(work, { recursive: true, force: true });
      }
    }
    case "page": {
      const { body } = await fetchText(src.url);
      return `${head}The reviewed text is not kept (only its digest), so this is the page's current text:\n\n${fence("", capped(normalizePage(body) ?? ""))}`;
    }
    case "json-field": {
      const { body } = await fetchText(src.url, 2_000_000);
      return `${head}The current document:\n\n${fence("json", capped(JSON.stringify(JSON.parse(body), null, 2)))}`;
    }
    default:
      return head;
  }
}

/**
 * Write what changed for the drifted spec whose issue carries `title` into
 * `out`: one Markdown file per moved source plus `entry.json`. Refuses a title
 * that no drifted spec in the manifest produces, which keeps the fix agent to
 * drift issues the watcher itself opened.
 */
async function context(manifestPath, { titleFile, out }) {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const problems = validateManifest(manifest);
  if (problems.length) throw new Error(`${manifestPath} is not valid`);
  const title = readFileSync(titleFile, "utf8").trim();
  const standard = manifest.standards.find((s) => issueTitle(manifest, s) === title);
  if (!standard) throw new Error("no watched spec has an issue with this title");
  mkdirSync(out, { recursive: true });
  const live = new Live();
  const moved = [];
  try {
    for (const [i, src] of standard.sources.entries()) {
      const pin = resolvePin(src.pin);
      const state = await live.resolve(src);
      if (!pinShapeOk(src.kind, state.value)) throw new Error(`the live value of ${sourceKey(src)} is not a valid ${src.kind} pin`);
      if (state.value === pin) continue;
      const file = `source-${i + 1}.md`;
      writeFileSync(join(out, file), await describeChange(live, src, pin, state.value));
      moved.push({ file, key: sourceKey(src), kind: src.kind, pin, live: state.value });
    }
  } finally {
    live.close();
  }
  if (moved.length === 0) throw new Error(`${standard.id} no longer differs from its pins`);
  writeFileSync(join(out, "entry.json"), `${JSON.stringify({ id: standard.id, name: standard.name, moved }, null, 2)}\n`);
  console.log(`${standard.id}: wrote ${moved.length} change file(s) to ${out}`);
}

const PIN_LINE = /^export const [A-Z][A-Z0-9_]* = "[A-Za-z0-9._@:+/-]*";$/;

/**
 * Problems with a unified diff (`git diff --binary` output) proposed by the
 * fix agent: every path must match `allow`; a path matching `pinsOnly` may
 * only change `export const NAME = "value";` lines; no binaries, symlinks,
 * renames, copies, mode changes or deleted files; a path matching `plain` may
 * gain no `<`, `{`, `}` or import/export lines (MDX compiles those to code
 * that a site build runs). Empty when the patch is fine.
 */
export function vetPatch(patch, { allow, pinsOnly, plain }) {
  const problems = [];
  const files = [];
  let current = null;
  for (const line of patch.split("\n")) {
    const header = /^diff --git a\/(\S+) b\/(\S+)$/.exec(line);
    if (header) {
      current = { a: header[1], b: header[2], lines: [] };
      files.push(current);
      continue;
    }
    if (!current) {
      if (line.trim()) problems.push("the patch has text before its first file");
      continue;
    }
    if (/^(old mode|new mode|deleted file mode|rename from|rename to|copy from|copy to|similarity index|GIT binary patch|Binary files)/.test(line)) {
      problems.push(`${current.b}: ${line.split(" ").slice(0, 2).join(" ")} is not allowed`);
    } else if (/^new file mode /.test(line) && !/^new file mode 100644$/.test(line)) {
      problems.push(`${current.b}: only regular files may be added`);
    } else if (/^[+-]/.test(line) && !/^(\+\+\+|---) /.test(line)) {
      current.lines.push(line);
    }
  }
  if (files.length === 0) problems.push("the patch changes nothing");
  for (const f of files) {
    if (f.a !== f.b) problems.push(`${f.b}: renames are not allowed`);
    if (!allow.test(f.b) || f.b.split("/").includes("..")) problems.push(`${f.b}: outside the paths the fix agent may change`);
    else if (pinsOnly && pinsOnly.test(f.b)) {
      for (const l of f.lines) if (!PIN_LINE.test(l.slice(1))) problems.push(`${f.b}: only pin constant lines may change here`);
    } else if (plain && plain.test(f.b)) {
      for (const l of f.lines) {
        if (l.startsWith("+") && (/[<{}]/.test(l) || /^\+\s*(import|export)\b/.test(l))) problems.push(`${f.b}: added lines may not contain markup or code here`);
      }
    }
  }
  return [...new Set(problems)];
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
        openedOut: option(args, "--opened-out"),
        escalateAfter: option(args, "--escalate-after"),
        escalateLabel: option(args, "--escalate-label"),
        escalateMention: option(args, "--escalate-mention"),
      });
    case "context":
      return context(args[0], { titleFile: option(args, "--title-file"), out: option(args, "--out") });
    case "vet-patch": {
      const allow = option(args, "--allow");
      const pinsOnly = option(args, "--pins-only");
      if (!allow) throw new Error("--allow <regex> is required");
      const plain = option(args, "--plain");
      const problems = vetPatch(readFileSync(args[0], "utf8"), {
        allow: new RegExp(allow),
        pinsOnly: pinsOnly ? new RegExp(pinsOnly) : undefined,
        plain: plain ? new RegExp(plain) : undefined,
      });
      for (const p of problems) console.log(`- ${p}`);
      if (problems.length) process.exit(1);
      console.log("the patch only touches allowed paths");
      return;
    }
    case "health": {
      const failed = option(args, "--failed");
      if (failed !== "true" && failed !== "false") throw new Error("--failed must be true or false");
      const report = healthReport({ failed: failed === "true", runUrl: option(args, "--run-url") });
      writeFileSync(option(args, "--out") ?? "health.json", `${JSON.stringify(report, null, 2)}\n`);
      console.log(failed === "true" ? "recorded a failed run" : "recorded a good run");
      return;
    }
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
      console.error("usage: spec-drift.mjs check|issues|health|context|vet-patch|lockstep|page-text|page-digest ... (see the comment at the top of this file)");
      process.exit(2);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
