import {
  CARD_SECONDS,
  type CardResult,
  cardPoints,
  type DealtCard,
  type Deck,
  dealCard,
  learnMore,
  openGroup,
  optionOrder,
  pickCards,
  RUN_CAPS,
  RUN_LENGTH,
} from "@/lib/quiz";
import type { QuizQuestion } from "@/lib/quiz-schema";

/** The end of a run, whichever deck it was. */
export interface Summary {
  deck: Deck;
  score: number;
  correct: number;
  total: number;
  results: boolean[];
  /** Expert runs only: the run's share page, and where it placed. */
  runId?: string;
  rank?: number;
  players?: number;
}

/**
 * Deals one run. The game screen doesn't know whether the cards come from the
 * page (open runs) or the server (expert runs, which the server times).
 */
export interface Dealer {
  deck: Deck;
  total: number;
  first(): Promise<DealtCard>;
  answer(position: number, choice: number | null, ms: number): Promise<{ result: CardResult; summary?: Summary }>;
  next(position: number): Promise<DealtCard>;
}

/** An open run, played entirely in the browser from the public deck. */
export function openDealer(deck: QuizQuestion[], standardNames: Record<string, string>): Dealer {
  const picked = pickCards(deck, RUN_LENGTH.open, RUN_CAPS.open, openGroup);
  const orders = picked.map((q) => optionOrder(q));
  const results: boolean[] = [];
  let score = 0;
  let streak = 0;
  const card = (i: number) => dealCard(picked[i] as QuizQuestion, orders[i] ?? []);
  return {
    deck: "open",
    total: picked.length,
    first: async () => card(0),
    next: async (position) => card(position),
    async answer(position, choice, ms) {
      const question = picked[position] as QuizQuestion;
      const shown = (orders[position] ?? []).indexOf(question.answer);
      const correct = choice === shown && ms <= CARD_SECONDS * 1000;
      streak = correct ? streak + 1 : 0;
      const points = cardPoints(correct, ms, streak);
      score += points;
      results.push(correct);
      const result: CardResult = {
        correct,
        answer: shown,
        explain: question.explain,
        learnMore: learnMore(question, question.standard ? standardNames[question.standard] : undefined),
        points,
        score,
        streak,
      };
      if (results.length < picked.length) return { result };
      return {
        result,
        summary: { deck: "open", score, correct: results.filter(Boolean).length, total: picked.length, results: [...results] },
      };
    },
  };
}

class PlayRequestError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new PlayRequestError(response.status, data.error ?? "Something went wrong. Try again.");
  return data;
}

interface RunState {
  runId: string;
  total: number;
  position: number;
  card: DealtCard;
}

/**
 * An expert run, dealt and scored by the server. Starting it deals the first
 * card, so `first` only hands that card over.
 */
export async function expertDealer(): Promise<Dealer> {
  const start = await post<RunState>("/api/play/runs");
  const url = `/api/play/runs/${start.runId}`;
  return {
    deck: "expert",
    total: start.total,
    first: async () => start.card,
    next: async (position) => (await post<RunState>(url, { action: "next", position })).card,
    async answer(position, choice) {
      const { result, summary } = await post<{
        result: CardResult;
        summary?: Omit<Summary, "deck">;
      }>(url, { action: "answer", position, choice });
      return { result, summary: summary && { ...summary, deck: "expert" } };
    },
  };
}
