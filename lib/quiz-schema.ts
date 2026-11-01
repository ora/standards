import { z } from "zod";
import { STANDARD_ID } from "./schema";

/**
 * The kinds of card, each with its own label on the card:
 *   quick  a plain question
 *   which  "Which standard am I?": a description, a file or a header; name the standard
 *   fake   "Spot the fake": one option is made up; `answer` points at it
 *   real   "Real or hype?": how real something is today
 */
export const QUIZ_KINDS = ["quick", "which", "fake", "real"] as const;
export type QuizKind = (typeof QUIZ_KINDS)[number];

/** A question id: lowercase words and hyphens, unique across both decks. */
export const QUESTION_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const text = z.string().trim().min(1);

/**
 * One card. Options are shuffled when the card is dealt, so no option may
 * depend on its position ("both of the above").
 */
export const quizQuestion = z
  .strictObject({
    id: z.string().regex(QUESTION_ID, "lowercase words joined by hyphens"),
    kind: z.enum(QUIZ_KINDS),
    /** The question, short enough to read on a phone in a few seconds. */
    prompt: text.max(220),
    /** Two to four answers, roughly the same length so the longest isn't a tell. */
    options: z.array(text.max(90)).min(2).max(4),
    /** Index into `options` of the right answer (for `fake`, of the made-up one). */
    answer: z.int().min(0),
    /** Shown after answering: why the answer is right, in one or two sentences. */
    explain: text.max(320),
    /** The ax.guide standard the card is about, linked as "Read more". */
    standard: z.string().regex(STANDARD_ID).optional(),
    /** The primary source for the fact the card tests. */
    source: z.url({ protocol: /^https$/ }),
    /** The day someone last checked the card against its source (YYYY-MM-DD). */
    checked: z.iso.date(),
  })
  .refine((q) => q.answer < q.options.length, { message: "answer must point at one of the options", path: ["answer"] })
  .refine((q) => new Set(q.options.map((o) => o.toLowerCase())).size === q.options.length, {
    message: "options must differ",
    path: ["options"],
  });

export type QuizQuestion = z.infer<typeof quizQuestion>;

export const quizDeck = z.array(quizQuestion).min(1);
