import { z } from "zod";
import { withPlayer } from "@/lib/play-route";
import { answerCard, nextCard, PlayError } from "@/lib/quiz-expert";

const step = z.discriminatedUnion("action", [
  z.strictObject({ action: z.literal("answer"), position: z.int().min(0), choice: z.int().min(0).max(3).nullable() }),
  z.strictObject({ action: z.literal("next"), position: z.int().min(0) }),
]);

/** One step of an expert run: answer the open card, or deal the next one. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withPlayer(async (userId) => {
    const parsed = step.safeParse(await request.json().catch(() => undefined));
    if (!parsed.success) throw new PlayError(400, "Malformed step.");
    const body = parsed.data;
    return body.action === "answer"
      ? answerCard(userId, id, body.position, body.choice)
      : nextCard(userId, id, body.position);
  });
}
