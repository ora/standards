import { OG_SIZE } from "@/lib/og";
import { quizShareImage } from "@/lib/og-quiz";
import { finishedRun } from "@/lib/quiz-expert";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "A verified expert run on the ax.guide agentic web quiz";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const run = await finishedRun((await params).id);
  return quizShareImage({
    kicker: run ? `${run.name} · expert run` : "ax.guide quiz · expert run",
    score: run?.score ?? 0,
    correct: run?.correct ?? 0,
    total: run?.total ?? 0,
    results: run?.results ?? [],
  });
}
