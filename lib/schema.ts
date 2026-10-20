import { z } from "zod";

/** The five jobs, in the order an agent's visit runs through them. */
export const JOB_IDS = ["find", "act", "identity", "shop", "pay"] as const;
export type JobId = (typeof JOB_IDS)[number];

/** How real a standard is today. */
export const STATUS_IDS = ["production", "early", "draft"] as const;
export type StatusId = (typeof STATUS_IDS)[number];

/** A file name in content/standards, without ".md": lowercase words and hyphens. */
export const STANDARD_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const text = z.string().trim().min(1);
const url = z.url({ protocol: /^https?$/ });

const repo = z.string().regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/, "a GitHub repository as owner/name");
const repoPath = z.string().regex(/^[^-\s/][^\s]*$/, "a path inside the repository, without a leading slash");
function isRegExp(source: string): boolean {
  try {
    new RegExp(source);
    return true;
  } catch {
    // RegExp throws SyntaxError on an invalid pattern, which is exactly what this answers.
    return false;
  }
}

const gitSha = z.string().regex(/^[0-9a-f]{40}$/, "a full 40-character Git SHA");

/**
 * One place a spec lives, and the exact state of it someone last read (`pin`).
 * The weekly spec drift check (scripts/spec-drift.mjs) compares the live
 * state with the pin and opens an issue when they differ.
 */
export const specSource = z.discriminatedUnion("kind", [
  /** A file (its blob SHA) or a folder (its tree SHA) on the default branch. */
  z.strictObject({ kind: z.literal("git-path"), repo, path: repoPath, pin: gitSha }),
  /** The default branch's head commit: any change anywhere in the repository. */
  z.strictObject({ kind: z.literal("git-head"), repo, pin: gitSha }),
  /** The newest dated revision folder under `path`, such as spec/2026-04-17. */
  z.strictObject({ kind: z.literal("git-dated-dirs"), repo, path: repoPath, pin: z.iso.date() }),
  /** The newest tag matching `match` (anchored with ^ and $), in version order. */
  z.strictObject({
    kind: z.literal("git-latest-tag"),
    repo,
    match: z
      .string()
      .regex(/^\^.+\$$/, "a regular expression anchored with ^ and $")
      .refine(isRegExp, "a valid regular expression"),
    pin: text.max(100),
  }),
  /** An IETF draft's latest revision, plus its state once it is no longer Active ("01 Expired"). */
  z.strictObject({
    kind: z.literal("ietf-draft"),
    name: z.string().regex(/^draft-[a-z0-9-]+$/, "a draft name such as draft-ietf-x-y"),
    pin: z.string().regex(/^\d{2}(?: [A-Za-z][A-Za-z ()-]{0,40})?$/, 'a revision such as "01", quoted'),
  }),
  /** A spec that is only a web page: SHA-256 of its normalized article text. */
  z.strictObject({
    kind: z.literal("page"),
    url: z.url({ protocol: /^https$/ }),
    pin: z.string().regex(/^[0-9a-f]{64}$/, "a 64-character SHA-256 digest"),
  }),
]);

export type SpecSource = z.infer<typeof specSource>;

/** The front matter of one content/standards/<id>.md file. */
export const standardFrontMatter = z.strictObject({
  /** The short name people use, such as "UCP". */
  name: text,
  /** The name written out, when it differs, such as "Universal Commerce Protocol". */
  full_name: text.optional(),
  job: z.enum(JOB_IDS),
  /** Position inside its job on the map, starting at 1. */
  order: z.int().positive(),
  status: z.enum(STATUS_IDS),
  /** The latest version and date, and a word on real use. */
  status_note: text,
  /** Two or three words for the map tile. */
  tagline: text.max(24),
  /** The job in one phrase, for the comparison table. */
  phrase: text,
  /** One plain picture of what it is. */
  analogy: text,
  /** What an agent actually meets: a file, a function or a status code. */
  looks_like: text,
  when_to_use: text,
  backers: text,
  /** How real it is, with sources. Inline Markdown. */
  reality_check: text,
  /** Primary sources: the spec first. */
  links: z.array(z.strictObject({ label: text, url })).min(1),
  /** Standards this one is often mixed up with or used next to. */
  related: z.array(z.strictObject({ id: z.string().regex(STANDARD_ID), note: text })).default([]),
  /** The day someone last checked every claim against its sources (YYYY-MM-DD). */
  last_verified: z.iso.date(),
  /** Where the spec lives and the state last read, so a weekly check can flag changes. */
  spec_sources: z.array(specSource).min(1),
});

export type StandardFrontMatter = z.infer<typeof standardFrontMatter>;

export const jobSchema = z.strictObject({
  id: z.enum(JOB_IDS),
  number: z.int().positive(),
  name: text,
  verb: text,
  description: text,
});

export const pairSchema = z.strictObject({
  id: z.string().regex(STANDARD_ID),
  title: text,
  summary: text,
  sides: z.array(z.strictObject({ id: z.string().regex(STANDARD_ID), says: text })).min(2),
});

export const guideSchema = z.strictObject({
  heading: text,
  lede: text,
  items: z
    .array(
      z.strictObject({
        situation: text,
        standards: z.array(z.string().regex(STANDARD_ID)).min(1),
        note: text.optional(),
      }),
    )
    .min(1),
});
