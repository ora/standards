import type { Metadata } from "next";
import Link from "next/link";
import { leaderboard } from "@/lib/quiz-expert";
import "../play.css";

export const metadata: Metadata = {
  title: "Quiz leaderboard",
  description: "The best expert runs on the ax.guide agentic web quiz.",
  alternates: { canonical: "/play/leaderboard" },
};

// Read fresh at most once a minute.
export const revalidate = 60;

type Props = { searchParams: Promise<{ period?: string }> };

/** Each player's best expert run: the expert deck is server-side, so these scores were earned. */
export default async function LeaderboardPage({ searchParams }: Props) {
  const period = (await searchParams).period === "week" ? "week" : "all";
  const rows = await leaderboard(period);
  return (
    <div className="wrap play">
      <header className="page-intro">
        <p className="kicker">The ax.guide quiz</p>
        <h1 className="page-title">Leaderboard</h1>
        <p className="lede">
          Each player&apos;s best expert run: 18 cards from a deck whose answers aren&apos;t public. Equal scores share a
          place, and the earlier run is listed first.
        </p>
      </header>
      <nav className="play-tabs" aria-label="Period">
        <Link className="button" href="/play/leaderboard" aria-current={period === "all" ? "page" : undefined}>
          All time
        </Link>
        <Link className="button" href="/play/leaderboard?period=week" aria-current={period === "week" ? "page" : undefined}>
          This week
        </Link>
      </nav>
      {rows === undefined ? (
        <p className="play-notice">The leaderboard opens with the expert deck, soon.</p>
      ) : rows.length === 0 ? (
        <p className="play-notice">No expert runs yet. The top spot is open.</p>
      ) : (
        <table className="play-board-table">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Player</th>
              <th scope="col" className="num">
                Right
              </th>
              <th scope="col" className="num">
                Points
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.runId}>
                <td>{row.rank}</td>
                <td>
                  <Link href={`/play/r/${row.runId}`}>{row.name}</Link>
                </td>
                <td className="num">
                  {row.correct}/{row.total}
                </td>
                <td className="num">{row.score.toLocaleString("en-US")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <Link href="/play" className="button button--primary" style={{ marginTop: "var(--space-10)" }}>
        Play
      </Link>
    </div>
  );
}
