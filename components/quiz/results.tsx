"use client";

import Link from "next/link";
import { useState } from "react";
import { shareGrid, verdict } from "@/lib/quiz";
import type { Summary } from "./dealers";

export function Results({
  summary,
  shareCode,
  misses,
  onAgain,
  expert,
}: {
  summary: Summary;
  /** Open runs: the code in /play/s/<code>. Expert runs share /play/r/<runId>. */
  shareCode?: string;
  misses: { href: string; label: string }[];
  onAgain: () => void;
  /** The way into the expert deck, after an open run. */
  expert?: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const path = summary.runId ? `/play/r/${summary.runId}` : `/play/s/${shareCode ?? ""}`;
  const url = typeof window === "undefined" ? path : `${window.location.origin}${path}`;
  const deckName = summary.deck === "expert" ? "Expert run" : "Agentic web quiz";
  const text = `${deckName} on ax.guide: ${summary.correct}/${summary.total}, ${summary.score.toLocaleString("en-US")} pts\n${shareGrid(summary.results)}`;

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ text, url });
        return;
      } catch {
        // Cancelled, or not allowed here: copy instead.
      }
    }
    await navigator.clipboard.writeText(`${text}\n${url}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2500);
  }

  const encoded = encodeURIComponent(`${text}\n${url}`);
  return (
    <div className="play-results">
      <p className="kicker">{deckName}</p>
      <h1 className="play-results__score">
        <span className="visually-hidden">Score: </span>
        {summary.score.toLocaleString("en-US")}
        <span className="play-results__pts"> pts</span>
      </h1>
      <p className="play-results__line">
        <strong>
          {summary.correct} of {summary.total}
        </strong>{" "}
        right. {verdict(summary.correct, summary.total)}
      </p>
      {summary.rank !== undefined && (
        <p className="play-results__rank">
          That places you <strong>#{summary.rank}</strong> of {summary.players} on the{" "}
          <Link href="/play/leaderboard">leaderboard</Link> (each player&apos;s best run counts).
        </p>
      )}
      <ol className="play-progress play-progress--big" aria-label="Your answers, in order">
        {summary.results.map((right, i) => (
          <li key={i} data-state={right ? "right" : "wrong"}>
            <span className="visually-hidden">
              Card {i + 1}: {right ? "right" : "wrong"}
            </span>
          </li>
        ))}
      </ol>

      <div className="play-results__share">
        <button type="button" className="button button--primary" onClick={share}>
          {copied ? "Copied" : "Share my score"}
        </button>
        <a className="button" href={`https://x.com/intent/post?text=${encoded}`} target="_blank" rel="noopener">
          Post on X
        </a>
        <a
          className="button"
          href={`https://www.linkedin.com/feed/?shareActive=true&text=${encoded}`}
          target="_blank"
          rel="noopener"
        >
          LinkedIn
        </a>
        <button type="button" className="button" onClick={onAgain}>
          Play again
        </button>
      </div>

      {misses.length > 0 && (
        <section className="play-results__misses" aria-labelledby="misses">
          <h2 id="misses" className="section-title">
            Brush up on
          </h2>
          <ul>
            {misses.map((m) => (
              <li key={m.href}>
                <a href={m.href} target="_blank" rel={m.href.startsWith("/") ? undefined : "noopener"}>
                  {m.label} ↗
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {expert && (
        <section className="play-results__next" aria-labelledby="next-deck">
          <h2 id="next-deck" className="section-title">
            Ready for harder?
          </h2>
          <p>
            The expert deck is 60 tougher cards, 18 a run, ranked on the leaderboard. Its answers aren&apos;t public, so
            the top of the board is earned.
          </p>
          {expert}
        </section>
      )}
    </div>
  );
}
