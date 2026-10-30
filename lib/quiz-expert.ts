import "server-only";
import { z } from "zod";
import {
  CARD_SECONDS,
  type CardResult,
  cardPoints,
  type DealtCard,
  dealCard,
  LATENCY_GRACE_MS,
  learnMore,
  optionOrder,
  pickCards,
  RUN_CAPS,
  RUN_LENGTH,
} from "./quiz";
import { type QuizQuestion, quizQuestion } from "./quiz-schema";
import { getStandard } from "./standards";
import { adminClient } from "./supabase-server";

/*
 * Expert runs, dealt and scored on the server so the leaderboard can trust
 * them. A run moves one way: deal a card (its clock starts), answer it (the
 * clock stops, the answer is revealed), deal the next. Every update is
 * guarded by the run's position and phase, so a card can't be answered twice
 * or have its clock restarted.
 */

/** Runs a player may start in a day: plenty to improve, too few to farm the deck in an afternoon. */
const RUNS_PER_DAY = 20;

const runCards = z.array(z.strictObject({ id: z.string(), order: z.array(z.int()) }));

interface RunRow {
  id: string;
  user_id: string;
  cards: unknown;
  position: number;
  served_at: string | null;
  score: number;
  correct: number;
  streak: number;
  results: string;
  finished_at: string | null;
}

export class PlayError extends Error {
  constructor(
    readonly status: 400 | 401 | 404 | 409 | 429 | 503,
    message: string,
  ) {
    super(message);
  }
}

function db() {
  const client = adminClient();
  if (!client) throw new PlayError(503, "Expert runs are not switched on here yet.");
  return client;
}

/** Active expert cards, checked against the schema; a broken row is skipped, not dealt. */
async function loadQuestions(ids?: string[]): Promise<Map<string, QuizQuestion>> {
  let query = db().from("quiz_questions").select("id, data").eq("active", true);
  if (ids) query = query.in("id", ids);
  const { data, error } = await query;
  if (error) throw new PlayError(503, "The expert deck could not be read.");
  const out = new Map<string, QuizQuestion>();
  for (const row of data ?? []) {
    const parsed = quizQuestion.safeParse(row.data);
    if (parsed.success && parsed.data.id === row.id) out.set(row.id, parsed.data);
    else console.error(`quiz_questions row "${row.id}" is not a valid card; skipped`);
  }
  return out;
}

export interface RunState {
  runId: string;
  total: number;
  position: number;
  card: DealtCard;
}

export interface RunSummary {
  runId: string;
  score: number;
  correct: number;
  total: number;
  results: boolean[];
  rank: number;
  players: number;
}

export async function startRun(userId: string): Promise<RunState> {
  const since = new Date(Date.now() - 86_400_000).toISOString();
  const { count } = await db()
    .from("quiz_runs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("started_at", since);
  if ((count ?? 0) >= RUNS_PER_DAY) throw new PlayError(429, `That's ${RUNS_PER_DAY} expert runs today. Come back tomorrow.`);

  const deck = [...(await loadQuestions()).values()];
  if (deck.length < RUN_LENGTH.expert) throw new PlayError(503, "The expert deck isn't loaded yet.");
  const picked = pickCards(deck, RUN_LENGTH.expert, RUN_CAPS.expert);
  const cards = picked.map((q) => ({ id: q.id, order: optionOrder(q) }));

  const { data, error } = await db()
    .from("quiz_runs")
    .insert({ user_id: userId, cards, served_at: new Date().toISOString() })
    .select("id")
    .single();
  if (error || !data) throw new PlayError(503, "The run could not be started.");
  const first = picked[0] as QuizQuestion;
  return { runId: data.id, total: cards.length, position: 0, card: dealCard(first, cards[0]?.order ?? []) };
}

async function loadRun(userId: string, runId: string): Promise<RunRow & { cardList: z.infer<typeof runCards> }> {
  if (!z.uuid().safeParse(runId).success) throw new PlayError(404, "No such run.");
  const { data } = await db().from("quiz_runs").select("*").eq("id", runId).eq("user_id", userId).maybeSingle<RunRow>();
  if (!data) throw new PlayError(404, "No such run.");
  return { ...data, cardList: runCards.parse(data.cards) };
}

/** Deal the card at `position`, after the one before it was answered. */
export async function nextCard(userId: string, runId: string, position: number): Promise<RunState> {
  const run = await loadRun(userId, runId);
  const slot = run.cardList[position];
  if (run.finished_at || run.served_at || run.position !== position || !slot) {
    throw new PlayError(409, "That card isn't next.");
  }
  const question = (await loadQuestions([slot.id])).get(slot.id);
  if (!question) throw new PlayError(503, "A card of this run is no longer in the deck.");
  const { data } = await db()
    .from("quiz_runs")
    .update({ served_at: new Date().toISOString() })
    .eq("id", runId)
    .eq("position", position)
    .is("served_at", null)
    .select("id");
  if (!data?.length) throw new PlayError(409, "That card isn't next.");
  return { runId, total: run.cardList.length, position, card: dealCard(question, slot.order) };
}

/**
 * Answer the open card. `choice` is the option's index as shown, or null when
 * the clock ran out. The server's own clock decides whether it was in time.
 */
export async function answerCard(
  userId: string,
  runId: string,
  position: number,
  choice: number | null,
): Promise<{ result: CardResult; summary?: RunSummary }> {
  const run = await loadRun(userId, runId);
  const slot = run.cardList[position];
  if (run.finished_at || !run.served_at || run.position !== position || !slot) {
    throw new PlayError(409, "That card isn't open.");
  }
  const question = (await loadQuestions([slot.id])).get(slot.id);
  if (!question) throw new PlayError(503, "A card of this run is no longer in the deck.");

  const ms = Date.now() - Date.parse(run.served_at);
  const inTime = ms <= CARD_SECONDS * 1000 + LATENCY_GRACE_MS;
  const shownAnswer = slot.order.indexOf(question.answer);
  const correct = inTime && choice === shownAnswer;
  const streak = correct ? run.streak + 1 : 0;
  const points = cardPoints(correct, ms, streak);
  const done = position + 1 === run.cardList.length;
  const now = new Date().toISOString();

  const update = {
    position: position + 1,
    served_at: null,
    score: run.score + points,
    correct: run.correct + (correct ? 1 : 0),
    streak,
    results: run.results + (correct ? "1" : "0"),
    finished_at: done ? now : null,
  };
  const { data } = await db()
    .from("quiz_runs")
    .update(update)
    .eq("id", runId)
    .eq("position", position)
    .not("served_at", "is", null)
    .select("id");
  if (!data?.length) throw new PlayError(409, "That card was already answered.");

  const result: CardResult = {
    correct,
    answer: shownAnswer,
    explain: question.explain,
    learnMore: learnMore(question, question.standard ? getStandard(question.standard)?.name : undefined),
    points,
    score: update.score,
    streak,
  };
  if (!done) return { result };
  const { rank, players } = await rankOf(update.score);
  return {
    result,
    summary: {
      runId,
      score: update.score,
      correct: update.correct,
      total: run.cardList.length,
      results: [...update.results].map((c) => c === "1"),
      rank,
      players,
    },
  };
}

/** Where a score places among every player's best. */
async function rankOf(score: number): Promise<{ rank: number; players: number }> {
  const { data } = await db().rpc("quiz_rank", { for_score: score }).maybeSingle<{ rank: number; players: number }>();
  return { rank: Number(data?.rank ?? 1), players: Number(data?.players ?? 1) };
}

export interface LeaderboardRow {
  rank: number;
  name: string;
  score: number;
  correct: number;
  total: number;
  runId: string;
}

/** Each player's best expert run, all time or in the last seven days. */
export async function leaderboard(period: "all" | "week", limit = 50): Promise<LeaderboardRow[] | undefined> {
  const client = adminClient();
  if (!client) return undefined;
  const since = period === "week" ? new Date(Date.now() - 7 * 86_400_000).toISOString() : "-infinity";
  const { data, error } = await client.rpc("quiz_leaderboard", { since, max_rows: limit });
  if (error) return undefined;
  return (data as { rank: number; name: string; score: number; correct: number; total: number; run_id: string }[]).map((r) => ({
    rank: Number(r.rank),
    name: r.name,
    score: r.score,
    correct: r.correct,
    total: r.total,
    runId: r.run_id,
  }));
}

/** A finished run, for its share page. Public: name, score and the grid only. */
export async function finishedRun(runId: string): Promise<
  { name: string; score: number; correct: number; total: number; results: boolean[]; finishedAt: string } | undefined
> {
  const client = adminClient();
  if (!client || !z.uuid().safeParse(runId).success) return undefined;
  const { data } = await client
    .from("quiz_runs")
    .select("score, correct, results, finished_at, user_id")
    .eq("id", runId)
    .not("finished_at", "is", null)
    .maybeSingle<{ score: number; correct: number; results: string; finished_at: string; user_id: string }>();
  if (!data) return undefined;
  const { data: profile } = await client.from("profiles").select("name").eq("id", data.user_id).maybeSingle<{ name: string }>();
  return {
    name: profile?.name ?? "A player",
    score: data.score,
    correct: data.correct,
    total: data.results.length,
    results: [...data.results].map((c) => c === "1"),
    finishedAt: data.finished_at,
  };
}

export async function playerName(userId: string): Promise<string | undefined> {
  const { data } = await db().from("profiles").select("name").eq("id", userId).maybeSingle<{ name: string }>();
  return data?.name;
}
