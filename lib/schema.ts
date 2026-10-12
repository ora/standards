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
