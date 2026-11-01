import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RUN_LENGTH } from "@/lib/quiz";
import type { QuizQuestion } from "@/lib/quiz-schema";

/*
 * Expert runs against an in-memory stand-in for the few Supabase calls
 * lib/quiz-expert.ts makes, so the run's guards (one answer per card, no
 * restarting the clock, late answers) are checked without a database. The
 * SQL itself lives in supabase/migrations.
 */

type Row = Record<string, unknown>;
type Filter = (row: Row) => boolean;

const tables: Record<string, Row[]> = { quiz_questions: [], quiz_runs: [], profiles: [] };

class Query implements PromiseLike<{ data: unknown; error: null; count?: number }> {
  private filters: Filter[] = [];
  private op: "select" | "insert" | "update" = "select";
  private payload: Row = {};
  private head = false;
  private one: "single" | "maybe" | undefined;

  constructor(private readonly table: string) {}

  select(_columns?: string, options?: { head?: boolean }) {
    this.head = options?.head ?? false;
    return this;
  }
  insert(row: Row) {
    this.op = "insert";
    this.payload = row;
    return this;
  }
  update(values: Row) {
    this.op = "update";
    this.payload = values;
    return this;
  }
  eq(column: string, value: unknown) {
    this.filters.push((row) => row[column] === value);
    return this;
  }
  gte(column: string, value: string) {
    this.filters.push((row) => String(row[column]) >= value);
    return this;
  }
  in(column: string, values: unknown[]) {
    this.filters.push((row) => values.includes(row[column]));
    return this;
  }
  is(column: string, value: null) {
    this.filters.push((row) => row[column] === value);
    return this;
  }
  not(column: string, _op: "is", value: null) {
    this.filters.push((row) => row[column] !== value);
    return this;
  }
  single() {
    this.one = "single";
    return this;
  }
  maybeSingle() {
    this.one = "maybe";
    return this;
  }

  private run(): { data: unknown; error: null; count?: number } {
    const rows = tables[this.table] as Row[];
    const matching = rows.filter((row) => this.filters.every((f) => f(row)));
    let data: Row[];
    if (this.op === "insert") {
      const row = { id: crypto.randomUUID(), position: 0, score: 0, correct: 0, streak: 0, results: "", finished_at: null, started_at: new Date().toISOString(), ...this.payload };
      rows.push(row);
      data = [row];
    } else if (this.op === "update") {
      for (const row of matching) Object.assign(row, this.payload);
      data = matching;
    } else {
      data = matching;
    }
    const copies = data.map((row) => structuredClone(row));
    if (this.head) return { data: null, error: null, count: matching.length };
    if (this.one) return { data: copies[0] ?? null, error: null };
    return { data: copies, error: null };
  }

  then<A, B>(onFulfilled?: (value: { data: unknown; error: null; count?: number }) => A | PromiseLike<A>, onRejected?: (reason: unknown) => B | PromiseLike<B>) {
    return Promise.resolve(this.run()).then(onFulfilled, onRejected);
  }
}

const fakeClient = {
  from: (table: string) => new Query(table),
  rpc: (name: string, args: { for_score: number }) => ({
    maybeSingle: async () => {
      expect(name).toBe("quiz_rank");
      const best = new Map<unknown, number>();
      for (const run of tables.quiz_runs ?? []) {
        if (run.finished_at) best.set(run.user_id, Math.max(best.get(run.user_id) ?? 0, Number(run.score)));
      }
      const ahead = [...best.values()].filter((s) => s > args.for_score).length;
      return { data: { rank: ahead + 1, players: best.size }, error: null };
    },
  }),
};

vi.mock("@/lib/supabase-server", () => ({ adminClient: () => fakeClient }));

const { answerCard, nextCard, PlayError, startRun } = await import("@/lib/quiz-expert");

const ALICE = "00000000-0000-4000-8000-00000000000a";
const BOB = "00000000-0000-4000-8000-00000000000b";

function question(i: number): QuizQuestion {
  return {
    id: `x-test-${i}`,
    kind: "quick",
    prompt: `Question ${i}?`,
    options: ["right", "wrong one", "wrong two", "wrong three"],
    answer: 0,
    explain: "Because.",
    source: "https://example.com/spec",
    checked: "2026-10-30",
  };
}

/** The option to press, as shown, for the card at `position` of a run. */
function rightChoice(runId: string, position: number): number {
  const run = tables.quiz_runs?.find((r) => r.id === runId) as { cards: { id: string; order: number[] }[] };
  const slot = run.cards[position] as { id: string; order: number[] };
  return slot.order.indexOf(0);
}

async function rejection(promise: Promise<unknown>): Promise<number | undefined> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof PlayError) return error.status;
    throw error;
  }
  return undefined;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-30T12:00:00Z"));
  tables.quiz_runs = [];
  tables.profiles = [];
  tables.quiz_questions = Array.from({ length: 30 }, (_, i) => ({ id: `x-test-${i}`, data: question(i), active: true }));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("expert runs", () => {
  it("deal cards without their answers", async () => {
    const run = await startRun(ALICE);
    expect(run.total).toBe(RUN_LENGTH.expert);
    expect(run.position).toBe(0);
    expect(Object.keys(run.card).sort()).toEqual(["id", "kind", "options", "prompt"]);
    expect([...run.card.options].sort()).toEqual(["right", "wrong one", "wrong three", "wrong two"]);
  });

  it("score a fast right answer, then deal the next card only once", async () => {
    const run = await startRun(ALICE);
    vi.advanceTimersByTime(1500);
    const { result } = await answerCard(ALICE, run.runId, 0, rightChoice(run.runId, 0));
    expect(result).toMatchObject({ correct: true, points: 150, score: 150, streak: 1 });
    expect(await rejection(answerCard(ALICE, run.runId, 0, 0))).toBe(409);

    await nextCard(ALICE, run.runId, 1);
    // Asking again must not restart the card's clock.
    expect(await rejection(nextCard(ALICE, run.runId, 1))).toBe(409);
  });

  it("call an answer late by the server's clock, whatever was chosen", async () => {
    const run = await startRun(ALICE);
    vi.advanceTimersByTime(23_000);
    const { result } = await answerCard(ALICE, run.runId, 0, rightChoice(run.runId, 0));
    expect(result).toMatchObject({ correct: false, points: 0 });
  });

  it("keep a run to its player", async () => {
    const run = await startRun(ALICE);
    expect(await rejection(answerCard(BOB, run.runId, 0, 0))).toBe(404);
    expect(await rejection(answerCard(ALICE, "not-a-uuid", 0, 0))).toBe(404);
  });

  it("finish with a summary and a rank, then accept nothing more", async () => {
    const run = await startRun(ALICE);
    let summary;
    for (let position = 0; position < run.total; position++) {
      if (position > 0) await nextCard(ALICE, run.runId, position);
      const choice = position % 3 === 0 ? (rightChoice(run.runId, position) + 1) % 4 : rightChoice(run.runId, position);
      ({ summary } = await answerCard(ALICE, run.runId, position, choice));
    }
    expect(summary).toMatchObject({ total: run.total, correct: 12, rank: 1, players: 1 });
    expect(summary?.results).toHaveLength(run.total);
    expect(await rejection(nextCard(ALICE, run.runId, run.total))).toBe(409);
  });

  it("skip a broken card instead of dealing it", async () => {
    tables.quiz_questions?.push({ id: "x-broken", data: { id: "x-broken", prompt: "?" }, active: true });
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const run = await startRun(ALICE);
    const dealt = (tables.quiz_runs?.[0]?.cards as { id: string }[]).map((c) => c.id);
    expect(dealt).not.toContain("x-broken");
    expect(run.card.id).not.toBe("x-broken");
    spy.mockRestore();
  });

  it("limit runs a day", async () => {
    for (let i = 0; i < 20; i++) await startRun(ALICE);
    expect(await rejection(startRun(ALICE))).toBe(429);
    expect(await rejection(startRun(BOB))).toBeUndefined();
  });

  it("refuse to start without enough cards", async () => {
    tables.quiz_questions = tables.quiz_questions?.slice(0, RUN_LENGTH.expert - 1) ?? [];
    expect(await rejection(startRun(ALICE))).toBe(503);
  });
});
