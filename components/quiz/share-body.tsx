import Link from "next/link";
import { verdict } from "@/lib/quiz";

/** A shared score: the result, the grid, and a dare to beat it. */
export function ShareBody({
  kicker,
  score,
  correct,
  results,
}: {
  kicker: string;
  score: number;
  correct: number;
  results: boolean[];
}) {
  return (
    <div className="wrap play play-share">
      <p className="kicker">{kicker}</p>
      <h1 className="play-results__score">
        {score.toLocaleString("en-US")}
        <span className="play-results__pts"> pts</span>
      </h1>
      <p className="play-results__line">
        <strong>
          {correct} of {results.length}
        </strong>{" "}
        right. {verdict(correct, results.length)}
      </p>
      <ol className="play-progress play-progress--big" aria-label="Their answers, in order">
        {results.map((right, i) => (
          <li key={i} data-state={right ? "right" : "wrong"}>
            <span className="visually-hidden">
              Card {i + 1}: {right ? "right" : "wrong"}
            </span>
          </li>
        ))}
      </ol>
      <p className="lede">How well do you know the standards that let AI agents find, use, sign in to, shop on and pay websites?</p>
      <Link href="/play" className="button button--primary">
        Beat this score
      </Link>
    </div>
  );
}
