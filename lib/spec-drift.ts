import "server-only";
import { z } from "zod";
import { content } from "./content";

/**
 * The weekly spec drift check (.github/workflows/spec-drift-watch.yml)
 * publishes which standards' specs changed since their pins were last
 * reviewed, with the issue that tracks each, to its own branch. Pages read it
 * so a reader learns of a change before anyone has rechecked the page.
 */
const statusSchema = z.object({
  standards: z.record(
    z.string(),
    z.object({
      changed: z.boolean(),
      issue: z.url({ protocol: /^https$/ }).optional(),
      since: z.iso.date().optional(),
    }),
  ),
});

export interface SpecDrift {
  /** The issue that tracks the change, on this repository only. */
  issue?: string;
}

/** An issue on this repository, and nothing that a browser could resolve elsewhere ("/issues/../.."). */
const ISSUE_URL = new RegExp(`^${content.repo.url.replace(/[.]/g, "\\.")}/issues/\\d+$`);

/** How often a page reads the status again, in seconds. Pages that call getSpecDrift use the same value. */
export const SPEC_DRIFT_REVALIDATE = 3600;

/**
 * Whether this standard's spec changed since its pins were reviewed. Returns
 * null when it did not, and also when the status can't be read: the note is
 * a hint, so a missing or broken status shows nothing rather than a guess.
 */
export async function getSpecDrift(id: string): Promise<SpecDrift | null> {
  let body: unknown;
  try {
    const res = await fetch(content.repo.specDriftStatusUrl, {
      next: { revalidate: SPEC_DRIFT_REVALIDATE },
      signal: AbortSignal.timeout(5000),
    });
    // 404 until the first weekly run publishes the branch.
    if (!res.ok) return null;
    body = await res.json();
  } catch (error) {
    // A network failure, a timeout or a body that isn't JSON: show no note, and say why in the logs.
    console.warn(`spec drift status unavailable: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    console.warn("spec drift status has an unexpected shape");
    return null;
  }
  const entry = parsed.data.standards[id];
  if (!entry?.changed) return null;
  return entry.issue && ISSUE_URL.test(entry.issue) ? { issue: entry.issue } : {};
}
