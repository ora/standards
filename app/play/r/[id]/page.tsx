import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { finishedRun } from "@/lib/quiz-expert";
import { ShareBody } from "@/components/quiz/share-body";
import "../../play.css";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const run = await finishedRun((await params).id);
  if (!run) return {};
  return {
    title: `${run.name}: ${run.correct}/${run.total} on the expert run`,
    description: `${run.score.toLocaleString("en-US")} points on the ax.guide expert deck, ranked. Can you beat it?`,
    robots: { index: false },
  };
}

/** A finished expert run, read from the database: a score the server counted. */
export default async function ExpertRun({ params }: Props) {
  const run = await finishedRun((await params).id);
  if (!run) notFound();
  return <ShareBody kicker={`${run.name} · expert run · verified`} score={run.score} correct={run.correct} results={run.results} />;
}
