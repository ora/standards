import { withPlayer } from "@/lib/play-route";
import { startRun } from "@/lib/quiz-expert";

/** Start an expert run: deals its first card. */
export async function POST() {
  return withPlayer((userId) => startRun(userId));
}
