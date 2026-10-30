import { OG_SIZE } from "@/lib/og";
import { quizShareImage } from "@/lib/og-quiz";
import { decodeShare } from "@/lib/quiz";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "A score on the ax.guide agentic web quiz";

export default async function Image({ params }: { params: Promise<{ code: string }> }) {
  const shared = decodeShare((await params).code) ?? { score: 0, results: [] };
  return quizShareImage({
    kicker: "ax.guide quiz · quick run",
    score: shared.score,
    correct: shared.results.filter(Boolean).length,
    total: shared.results.length,
    results: shared.results,
  });
}
