import { json } from "@/lib/play-route";
import { playerName } from "@/lib/quiz-expert";
import { currentUserId, playBackendEnabled } from "@/lib/supabase-server";

/** Whether expert runs are on, and who is signed in. */
export async function GET() {
  if (!playBackendEnabled()) return json({ enabled: false, player: null });
  const userId = await currentUserId();
  return json({ enabled: true, player: userId ? { name: (await playerName(userId)) ?? "player" } : null });
}
