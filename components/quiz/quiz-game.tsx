"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { CARD_SECONDS, type CardResult, type DealtCard, encodeShare, KIND_LABELS, RUN_LENGTH } from "@/lib/quiz";
import type { QuizQuestion } from "@/lib/quiz-schema";
import { type Dealer, expertDealer, openDealer, type Summary } from "./dealers";
import { Results } from "./results";
import { SignIn } from "./sign-in";

type Phase =
  | { name: "intro" }
  | { name: "loading" }
  | { name: "card"; card: DealtCard; position: number; dealtAt: number }
  | { name: "revealed"; card: DealtCard; position: number; choice: number | null; result: CardResult; summary?: Summary }
  | { name: "done"; summary: Summary; misses: CardResult["learnMore"][] };

interface Me {
  enabled: boolean;
  player: { name: string } | null;
}

const LETTERS = ["A", "B", "C", "D"];

export function QuizGame({ deck, standardNames }: { deck: QuizQuestion[]; standardNames: Record<string, string> }) {
  const [phase, setPhase] = useState<Phase>({ name: "intro" });
  const [me, setMe] = useState<Me | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [notice, setNotice] = useState<string | undefined>();
  const [results, setResults] = useState<boolean[]>([]);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const dealer = useRef<Dealer | undefined>(undefined);
  const misses = useRef<CardResult["learnMore"][]>([]);
  const busy = useRef(false);
  const promptRef = useRef<HTMLHeadingElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const expertRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    fetch("/api/play/me")
      .then((r) => (r.ok ? (r.json() as Promise<Me>) : { enabled: false, player: null }))
      .catch(() => ({ enabled: false, player: null }))
      .then((found) => {
        setMe(found);
        if (new URLSearchParams(window.location.search).get("signin") === "failed") {
          setNotice("That sign-in link didn't work. It may have expired; try again.");
        }
      });
  }, []);

  // Back from signing in for the expert deck: put the start button in reach.
  useEffect(() => {
    if (me?.player && new URLSearchParams(window.location.search).get("deck") === "expert") expertRef.current?.focus();
  }, [me]);

  async function begin(make: () => Promise<Dealer>) {
    if (busy.current) return;
    busy.current = true;
    setError(undefined);
    setPhase({ name: "loading" });
    try {
      const d = await make();
      dealer.current = d;
      misses.current = [];
      setResults([]);
      setScore(0);
      setTotal(d.total);
      const card = await d.first();
      setPhase({ name: "card", card, position: 0, dealtAt: performance.now() });
    } catch (e) {
      setError(e instanceof Error ? e.message : "The run could not start.");
      setPhase({ name: "intro" });
    } finally {
      busy.current = false;
    }
  }

  const answer = useCallback(
    async (choice: number | null) => {
      if (phase.name !== "card" || !dealer.current || busy.current) return;
      busy.current = true;
      const ms = performance.now() - phase.dealtAt;
      try {
        const { result, summary } = await dealer.current.answer(phase.position, choice, ms);
        if (!result.correct) misses.current.push(result.learnMore);
        setResults((r) => [...r, result.correct]);
        setScore(result.score);
        setPhase({ name: "revealed", card: phase.card, position: phase.position, choice, result, summary });
      } catch (e) {
        setError(e instanceof Error ? e.message : "That answer didn't go through.");
      } finally {
        busy.current = false;
      }
    },
    [phase],
  );

  const advance = useCallback(async () => {
    if (phase.name !== "revealed" || !dealer.current || busy.current) return;
    if (phase.summary) {
      const unique = [...new Map(misses.current.map((m) => [m.href, m])).values()];
      setPhase({ name: "done", summary: phase.summary, misses: unique });
      return;
    }
    busy.current = true;
    try {
      const position = phase.position + 1;
      const card = await dealer.current.next(position);
      setPhase({ name: "card", card, position, dealtAt: performance.now() });
    } catch (e) {
      setError(e instanceof Error ? e.message : "The next card didn't come.");
    } finally {
      busy.current = false;
    }
  }, [phase]);

  // The clock: running out counts as a wrong answer.
  useEffect(() => {
    if (phase.name !== "card") return;
    const timer = window.setTimeout(() => answer(null), CARD_SECONDS * 1000);
    return () => window.clearTimeout(timer);
  }, [phase, answer]);

  // Focus follows the game, so it plays from the keyboard and reads well aloud.
  useEffect(() => {
    if (phase.name === "card") promptRef.current?.focus();
    if (phase.name === "revealed") nextRef.current?.focus();
  }, [phase]);

  // 1-4 or A-D answer; Enter or the right arrow moves on.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (phase.name === "card") {
        const key = event.key.toUpperCase();
        const index = /^[1-4]$/.test(key) ? Number(key) - 1 : LETTERS.indexOf(key);
        if (index >= 0 && index < phase.card.options.length) {
          event.preventDefault();
          answer(index);
        }
      } else if (phase.name === "revealed" && event.key === "ArrowRight") {
        event.preventDefault();
        advance();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, answer, advance]);

  async function signOut() {
    await fetch("/api/play/signout", { method: "POST" });
    setMe((m) => (m ? { ...m, player: null } : m));
  }

  const playOpen = () => begin(async () => openDealer(deck, standardNames));
  const playExpert = () => begin(expertDealer);

  if (phase.name === "intro" || phase.name === "loading") {
    const loading = phase.name === "loading";
    return (
      <div className="play-intro">
        <header className="page-intro">
          <p className="kicker">The ax.guide quiz</p>
          <h1 className="page-title play-intro__title">
            How well do you know the <mark>agentic web</mark>?
          </h1>
          <p className="lede">
            {RUN_LENGTH.open} cards on the standards that let AI agents find, use, sign in to, shop on and pay websites,
            and the web plumbing under them. {CARD_SECONDS} seconds a card. Fast answers score more, and so does a streak.
          </p>
        </header>

        {notice && (
          <p className="play-notice" role="status">
            {notice}
          </p>
        )}
        {error && (
          <p className="play-notice play-notice--error" role="alert">
            {error}
          </p>
        )}

        <div className="play-decks">
          <section className="play-deck play-deck--open" aria-labelledby="deck-open">
            <p className="play-deck__count">{RUN_LENGTH.open} cards</p>
            <h2 id="deck-open" className="play-deck__name">
              Quick run
            </h2>
            <p>No sign-up. A random dozen from the open deck, then a score to share.</p>
            <button type="button" className="button button--primary play-deck__go" onClick={playOpen} disabled={loading}>
              {loading ? "Dealing" : "Play now"}
            </button>
          </section>

          <section className="play-deck play-deck--expert" aria-labelledby="deck-expert">
            <p className="play-deck__count">{RUN_LENGTH.expert} cards · ranked</p>
            <h2 id="deck-expert" className="play-deck__name">
              Expert run
            </h2>
            <p>
              A second deck of 60 harder cards: headers, handshakes and the pairs everyone mixes up. Its answers aren&apos;t
              on GitHub, so the leaderboard means something.
            </p>
            {me === undefined ? null : !me.enabled ? (
              <p className="play-deck__soon">The expert deck and leaderboard open soon.</p>
            ) : me.player ? (
              <>
                <button
                  ref={expertRef}
                  type="button"
                  className="button button--primary play-deck__go"
                  onClick={playExpert}
                  disabled={loading}
                >
                  Start expert run
                </button>
                <p className="play-deck__who">
                  Playing as <strong>{me.player.name}</strong>.{" "}
                  <button type="button" className="play-link" onClick={signOut}>
                    Sign out
                  </button>
                </p>
              </>
            ) : (
              <>
                <p className="play-deck__unlock">Sign in to unlock it:</p>
                <SignIn />
              </>
            )}
          </section>
        </div>

        <p className="play-intro__foot">
          {me?.enabled && (
            <>
              <Link href="/play/leaderboard">See the leaderboard</Link> ·{" "}
            </>
          )}
          Every answer links to the page that explains it.
        </p>
      </div>
    );
  }

  if (phase.name === "done") {
    return (
      <Results
        summary={phase.summary}
        shareCode={phase.summary.deck === "open" ? encodeShare(phase.summary.score, phase.summary.results) : undefined}
        misses={phase.misses}
        onAgain={phase.summary.deck === "open" ? playOpen : playExpert}
        expert={
          phase.summary.deck === "open" && me?.enabled ? (
            me.player ? (
              <button type="button" className="button button--primary" onClick={playExpert}>
                Try the expert deck
              </button>
            ) : (
              <SignIn />
            )
          ) : undefined
        }
      />
    );
  }

  const revealed = phase.name === "revealed" ? phase : undefined;
  return (
    <div className="play-board">
      <div className="play-hud">
        <ol className="play-progress" aria-label={`Card ${phase.position + 1} of ${total}`}>
          {Array.from({ length: total }, (_, i) => (
            <li
              key={i}
              data-state={i < results.length ? (results[i] ? "right" : "wrong") : i === phase.position ? "now" : "todo"}
            />
          ))}
        </ol>
        <p className="play-hud__score">
          <span className="play-hud__points">
            <strong>{score.toLocaleString("en-US")}</strong> pts
          </span>
          {revealed && revealed.result.streak > 1 && <span className="play-hud__streak">{revealed.result.streak} in a row</span>}
        </p>
      </div>

      <article className="play-card" data-kind={phase.card.kind} data-state={revealed ? (revealed.result.correct ? "right" : "wrong") : "open"}>
        <p className="play-card__kind">
          <span>{KIND_LABELS[phase.card.kind]}</span>
          <span className="play-card__count">
            {phase.position + 1}/{total}
          </span>
        </p>
        {!revealed && <div key={phase.card.id} className="play-clock" style={{ animationDuration: `${CARD_SECONDS}s` }} aria-hidden="true" />}
        <h2 ref={promptRef} tabIndex={-1} className="play-card__prompt">
          {phase.card.prompt}
        </h2>
        <ul className="play-options">
          {phase.card.options.map((option, i) => {
            const state = !revealed
              ? undefined
              : i === revealed.result.answer
                ? "answer"
                : i === revealed.choice
                  ? "chosen"
                  : "other";
            return (
              <li key={`${phase.card.id}-${i}`}>
                <button
                  type="button"
                  className="play-option"
                  data-state={state}
                  disabled={Boolean(revealed)}
                  onClick={() => answer(i)}
                >
                  <span className="play-option__key" aria-hidden="true">
                    {LETTERS[i]}
                  </span>
                  <span>{option}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {revealed && (
          <div className="play-reveal">
            <p className="play-reveal__verdict" role="status">
              {revealed.choice === null && !revealed.result.correct
                ? "Time's up."
                : revealed.result.correct
                  ? `Right. +${revealed.result.points}`
                  : "Not quite."}
            </p>
            <p className="play-reveal__explain">{revealed.result.explain}</p>
            <div className="play-reveal__actions">
              <a
                className="play-link"
                href={revealed.result.learnMore.href}
                target="_blank"
                rel={revealed.result.learnMore.href.startsWith("/") ? undefined : "noopener"}
              >
                {revealed.result.learnMore.label} ↗
              </a>
              <button ref={nextRef} type="button" className="button button--primary" onClick={advance}>
                {revealed.summary ? "See my score" : "Next card"} →
              </button>
            </div>
          </div>
        )}
      </article>

      {error && (
        <p className="play-notice play-notice--error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
