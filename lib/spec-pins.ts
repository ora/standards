import type { Standard } from "./standards";

/** The generated list of watched specs, at the root of the repository. */
export const SPEC_PINS_FILE = "spec-pins.json";

/**
 * Every standard's spec sources and reviewed pins, in the manifest shape
 * scripts/spec-drift.mjs reads. The weekly spec drift check runs on this
 * file, and Ora's own watcher reads it from GitHub to compare its pins with
 * ours, so it is generated from content/standards and committed.
 */
export function specPins(standards: Standard[], siteUrl = "https://ax.guide") {
  return {
    $comment: "Generated from the spec_sources field in content/standards. Run `npm run pins` after changing one.",
    // Where each standard's pins are edited, for the fix workflow's `spec-drift.mjs apply-pins`.
    pin_file: "content/standards/{id}.md",
    issue: {
      title: "{name}: the spec changed since ax.guide last checked it",
      impact: "The page at {page} describes the state that was read, so it may now say something the spec no longer does.",
      todo: [
        "Read what changed (the links below) and recheck `content/standards/{id}.md` against it. Fix any claim that moved.",
        "Then set each moved source's `pin` in the page's `spec_sources` to the live value listed here, and run `npm run pins`.",
        "Change `last_verified` only if you rechecked every claim on the page.",
      ].join(" "),
    },
    standards: standards.map((s) => ({
      id: s.id,
      name: s.name,
      page: `${siteUrl}/standards/${s.id}`,
      sources: s.spec_sources,
    })),
  };
}

/** The file's text: stable key order, two-space indent, trailing newline. */
export function specPinsJson(standards: Standard[]): string {
  return `${JSON.stringify(specPins(standards), null, 2)}\n`;
}
