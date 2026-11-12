import type { Metadata } from "next";
import { QuizGame } from "@/components/quiz/quiz-game";
import { getOpenDeck } from "@/lib/quiz-open";
import { getStandards } from "@/lib/standards";
import "./play.css";

export const metadata: Metadata = {
  title: "The agentic web quiz",
  description:
    "How well do you know the standards that let AI agents find, use, sign in to, shop on and pay websites? Twelve cards, twenty seconds each.",
  alternates: { canonical: "/play" },
};

/**
 * The quiz. Static: the open deck ships with the page and an open run plays in
 * the browser. Expert runs talk to /api/play.
 */
export default function PlayPage() {
  const standardNames = Object.fromEntries(getStandards().map((s) => [s.id, s.name]));
  return (
    <div className="wrap play">
      <QuizGame deck={getOpenDeck()} standardNames={standardNames} />
    </div>
  );
}
