import "server-only";
import { REGISTRY_VERSION, SPEC_IDS, SPECS, type Spec, type SpecId, type VersionStatus } from "@ora-ai/specs";
import { changeUrl, liveValueOk, revisionOf, sourceKey, type Revision } from "@ora-ai/specs/kinds";
import { z } from "zod";
import { content } from "./content";
import { getStandards } from "./standards";

/**
 * The spec registry (github.com/ora/specs, the @ora-ai/specs package) owns
 * every spec's versions and the state Ora last reviewed. Its daily watch
 * publishes what it saw upstream to the registry's `status` branch, so pages
 * learn of a spec change without waiting for a package release. This module
 * joins the two for /specs, /specs.json, /specs/<id>.json and the "the spec
 * changed" note on each standard's page. It never carries which release any
 * product runs: that adoption data is internal to Ora.
 */

/** How often pages and routes read the status again, in seconds. */
export const SPEC_STATUS_REVALIDATE = 3600;

const statusSchema = z.object({
  checked_at: z.iso.datetime(),
  standards: z.record(
    z.string(),
    z.object({
      changed: z.boolean(),
      issue: z.url({ protocol: /^https$/ }).optional(),
      since: z.iso.date().optional(),
      sources: z.record(z.string(), z.object({ kind: z.string(), live: z.string() })).optional(),
    }),
  ),
});

type SpecStatus = z.infer<typeof statusSchema>;

/** An issue on the registry repository, and nothing a browser could resolve elsewhere ("/issues/../.."). */
const ISSUE_URL = new RegExp(`^${content.repo.specsUrl.replace(/[.]/g, "\\.")}/issues/\\d+$`);

/**
 * The watch's last published status, or null when it can't be read: the
 * upstream column is a hint, so a missing or broken status shows "not read"
 * rather than a guess.
 */
export async function getSpecStatus(): Promise<SpecStatus | null> {
  let body: unknown;
  try {
    const res = await fetch(content.repo.specStatusUrl, {
      next: { revalidate: SPEC_STATUS_REVALIDATE },
      signal: AbortSignal.timeout(5000),
    });
    // 404 until the registry's first watch run publishes the branch.
    if (!res.ok) return null;
    body = await res.json();
  } catch (error) {
    // A network failure, a timeout or a body that isn't JSON: show nothing, and say why in the logs.
    console.warn(`spec status unavailable: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    console.warn("spec status has an unexpected shape");
    return null;
  }
  return parsed.data;
}

export type UpstreamState = "same" | "changed" | "unknown";

/** One version as the registry records it; the package types each spec's exact entries, this is their common shape. */
export interface PublicVersion {
  readonly id: string;
  readonly status: VersionStatus;
  readonly label?: string;
  readonly url?: string;
  readonly published?: string;
}

export interface PublicSpec {
  readonly id: string;
  readonly name: string;
  readonly homepage: string;
  readonly spec_url: string;
  readonly versions: readonly PublicVersion[];
  readonly current: string | null;
  readonly preview: readonly string[];
  readonly supported: readonly string[];
  readonly deprecated: readonly string[];
  /** The version Ora last read and turned into rules, or null when the registry only watches the spec. */
  readonly reviewed: { readonly version: string | null; readonly read: string; readonly label: string; readonly url: string | null } | null;
  /** What the registry's watch last saw upstream, compared with the reviewed (or watched) state. */
  readonly latest: {
    readonly state: UpstreamState;
    /** The newer named revision, when the spec names its revisions (a dated folder, a tag, a draft number). */
    readonly revision: Revision | null;
    /** Where to read what changed, when it changed. */
    readonly changes: string | null;
    readonly since: string | null;
    readonly issue: string | null;
  };
  /** This site's page for the standard built on the spec, if there is one. */
  readonly standard: string | null;
}

function reviewedView(entry: Spec): PublicSpec["reviewed"] {
  const r = entry.reviewed;
  if (!r) return null;
  const version = (entry.versions as readonly PublicVersion[]).find((v) => v.id === r.version);
  const url =
    r.url ?? version?.url ?? (r.version && entry.revision_url ? entry.revision_url.replaceAll("{revision}", r.version) : null);
  return { version: r.version, read: r.read, label: r.label ?? version?.label ?? r.version ?? "Unversioned", url };
}

function latestView(entry: Spec, status: SpecStatus | null): PublicSpec["latest"] {
  const seen = status?.standards[entry.id];
  if (!seen) return { state: "unknown", revision: null, changes: null, since: null, issue: null };
  const issue = seen.issue && ISSUE_URL.test(seen.issue) ? seen.issue : null;
  if (!seen.changed) return { state: "same", revision: null, changes: null, since: null, issue: null };
  let revision: Revision | null = null;
  let changes: string | null = null;
  for (const source of entry.sources) {
    const live = seen.sources?.[sourceKey(source)]?.live;
    // Only a live value of the shape this source's kind produces is ever shown or linked.
    if (!liveValueOk(source, live) || live === source.pin) continue;
    revision ??= revisionOf(source, live, entry.revision_url);
    changes ??= changeUrl(source, source.pin, live, { revisionUrl: entry.revision_url, fallbackUrl: entry.spec_url });
  }
  return { state: "changed", revision, changes, since: seen.since ?? null, issue };
}

/** Every spec in the registry, in registry (id) order, joined with the watch's last status. */
export function publicSpecs(status: SpecStatus | null, siteUrl: string): PublicSpec[] {
  const pages = new Map(getStandards().map((s) => [s.spec, `${siteUrl}/standards/${s.id}`]));
  return SPEC_IDS.map((id) => {
    const entry: Spec = SPECS[id];
    return {
      id: entry.id,
      name: entry.name,
      homepage: entry.homepage,
      spec_url: entry.spec_url,
      versions: entry.versions as readonly PublicVersion[],
      current: entry.current,
      preview: entry.preview,
      supported: entry.supported,
      deprecated: entry.deprecated,
      reviewed: reviewedView(entry),
      latest: latestView(entry, status),
      standard: pages.get(id) ?? null,
    };
  });
}

/** The body of /specs.json. */
export function specsDocument(status: SpecStatus | null, siteUrl: string) {
  return {
    registry: { version: REGISTRY_VERSION, url: content.repo.specsUrl, package: "@ora-ai/specs" },
    checked_at: status?.checked_at ?? null,
    specs: publicSpecs(status, siteUrl),
  };
}

export function isSpecId(id: string): id is SpecId {
  return (SPEC_IDS as readonly string[]).includes(id);
}

export interface SpecDrift {
  /** The registry issue that tracks the change. */
  issue?: string;
}

/**
 * Whether this spec changed upstream since Ora last reviewed it. Null when it
 * did not, and also when the status can't be read.
 */
export async function getSpecDrift(id: string): Promise<SpecDrift | null> {
  const entry = (await getSpecStatus())?.standards[id];
  if (!entry?.changed) return null;
  return entry.issue && ISSUE_URL.test(entry.issue) ? { issue: entry.issue } : {};
}
