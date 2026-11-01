import type { QuizKind, QuizQuestion } from "./quiz-schema";

/*
 * The game's rules, shared by the browser (open runs) and the server
 * (expert runs), so both score a card the same way.
 */

/** Cards in a run of each deck. */
export const RUN_LENGTH = { open: 12, expert: 18 } as const;
export type Deck = keyof typeof RUN_LENGTH;

/** Seconds a card stays open. Running out counts as a wrong answer. */
export const CARD_SECONDS = 20;
/** Answers inside this many seconds earn the whole speed bonus. */
const FULL_BONUS_SECONDS = 3;
/** Extra time the server allows for the network before it calls an answer late. */
export const LATENCY_GRACE_MS = 2_000;

export const POINTS = { correct: 100, speed: 50, streakStep: 10, streakMax: 50 } as const;

/**
 * Points for one card. A right answer earns 100, up to 50 more for speed
 * (all of it inside 3 seconds, none at 20), and 10 more for each right answer
 * before it in an unbroken streak, up to 50. A wrong answer earns nothing.
 */
export function cardPoints(correct: boolean, ms: number, streak: number): number {
  if (!correct) return 0;
  const seconds = Math.max(0, ms) / 1000;
  const speed = Math.min(1, Math.max(0, (CARD_SECONDS - seconds) / (CARD_SECONDS - FULL_BONUS_SECONDS)));
  const streakBonus = Math.min(POINTS.streakMax, POINTS.streakStep * Math.max(0, streak - 1));
  return POINTS.correct + Math.round(POINTS.speed * speed) + streakBonus;
}

/** The most a run can score, for the share code's sanity check. */
export function maxScore(cards: number): number {
  let total = 0;
  for (let i = 1; i <= cards; i++) total += cardPoints(true, 0, i);
  return total;
}

/** What a player sees of a card: no answer, options in dealt order. */
export interface DealtCard {
  id: string;
  kind: QuizKind;
  prompt: string;
  options: string[];
}

/** What a player learns after answering. */
export interface CardResult {
  correct: boolean;
  /** The right option, in dealt order. */
  answer: number;
  explain: string;
  /** "Read more": the standard's page, or the card's source. */
  learnMore: { href: string; label: string };
  points: number;
  score: number;
  streak: number;
}

export const KIND_LABELS: Record<QuizKind, string> = {
  quick: "Quick check",
  which: "Which standard am I?",
  fake: "Spot the fake",
  real: "Real or hype?",
};

/** A random integer in [0, n), from the platform's secure source on both sides. */
function randomBelow(n: number): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return (buf[0] ?? 0) % n;
}

/** Fisher-Yates, on a copy. */
export function shuffle<T>(list: readonly T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomBelow(i + 1);
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

/**
 * Pick a run's cards at random, with at most `caps[group]` from a group (by
 * default a card's kind), so a run never turns into twelve of one kind. When
 * the caps leave too few cards, the rest are filled from what was skipped.
 */
export function pickCards<T extends { kind: QuizKind }>(
  deck: readonly T[],
  count: number,
  caps: Record<string, number> = {},
  groupOf: (card: T) => string = (card) => card.kind,
): T[] {
  const picked: T[] = [];
  const skipped: T[] = [];
  const perGroup = new Map<string, number>();
  for (const card of shuffle(deck)) {
    if (picked.length === count) break;
    const group = groupOf(card);
    const used = perGroup.get(group) ?? 0;
    if (used >= (caps[group] ?? Infinity)) {
      skipped.push(card);
      continue;
    }
    perGroup.set(group, used + 1);
    picked.push(card);
  }
  return [...picked, ...skipped].slice(0, count);
}

/** Caps per run, by group: a status card is its own group in the open deck. */
export const RUN_CAPS = {
  open: { status: 2, real: 2, which: 4, fake: 3 },
  expert: { real: 3, which: 5, fake: 4 },
} as const;

/** The group of an open card for RUN_CAPS: status cards are capped on their own. */
export function openGroup(card: Pick<QuizQuestion, "id" | "kind">): string {
  return card.id.startsWith("o-status-") ? "status" : card.kind;
}

/**
 * The order to show a card's options in: order[shownIndex] = index in the
 * question. Shuffled, except where the written order is the natural one: a
 * scale ("Real or hype?") or True and False.
 */
export function optionOrder(question: Pick<QuizQuestion, "kind" | "options">): number[] {
  const indexes = question.options.map((_, i) => i);
  const trueFalse = question.options.length === 2 && question.options.every((o) => /^(true|false)$/i.test(o));
  return question.kind === "real" || trueFalse ? indexes : shuffle(indexes);
}

export function dealCard(question: QuizQuestion, order: number[]): DealtCard {
  return {
    id: question.id,
    kind: question.kind,
    prompt: question.prompt,
    options: order.map((i) => question.options[i] ?? ""),
  };
}

export function learnMore(question: Pick<QuizQuestion, "standard" | "source">, standardName?: string): CardResult["learnMore"] {
  return question.standard
    ? { href: `/standards/${question.standard}`, label: `Read about ${standardName ?? question.standard} on ax.guide` }
    : { href: question.source, label: `Read the source: ${new URL(question.source).hostname.replace(/^www\./, "")}` };
}

/**
 * The share code of an open run, "1840-110111011101": the score, then a 1 or
 * 0 per card. It is not proof of anything (open runs are played in the
 * browser); expert runs are shared by their run id instead.
 */
export function encodeShare(score: number, results: boolean[]): string {
  return `${score}-${results.map((r) => (r ? "1" : "0")).join("")}`;
}

export function decodeShare(code: string): { score: number; results: boolean[] } | undefined {
  const match = /^(\d{1,5})-([01]{1,24})$/.exec(code);
  if (!match) return undefined;
  const score = Number(match[1]);
  const results = [...(match[2] ?? "")].map((c) => c === "1");
  return score <= maxScore(results.length) ? { score, results } : undefined;
}

/** The emoji row of a share: orange for right, black for wrong. */
export function shareGrid(results: boolean[]): string {
  return results.map((r) => (r ? "🟧" : "⬛")).join("");
}

/** A verdict line for a share of right answers, so a score reads like a result. */
export function verdict(correct: number, total: number): string {
  const share = total ? correct / total : 0;
  if (share === 1) return "Flawless. You could maintain this guide.";
  if (share >= 0.83) return "Agent-ready. You know the map.";
  if (share >= 0.6) return "Solid. A couple of standards to brush up on.";
  if (share >= 0.4) return "Getting there. The map has a few surprises left.";
  return "Plenty to learn. Good news: that's what the guide is for.";
}

/** A same-site path to return to after signing in; anything else goes to /play. */
export function safeNext(value: string | null): string {
  return value && /^\/(?!\/)[\w\-./?=&%]*$/.test(value) ? value : "/play";
}
