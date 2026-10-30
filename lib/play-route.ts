import "server-only";
import { NextResponse } from "next/server";
import { PlayError } from "./quiz-expert";
import { currentUserId } from "./supabase-server";

/** No quiz response is ever cached: each one belongs to one player at one moment. */
const NO_STORE = { "Cache-Control": "private, no-store" };

export function json(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

/** Run a quiz handler for the signed-in player, turning PlayErrors into JSON errors. */
export async function withPlayer(handler: (userId: string) => Promise<unknown>): Promise<NextResponse> {
  try {
    const userId = await currentUserId();
    if (!userId) return json({ error: "Sign in to play an expert run." }, 401);
    return json(await handler(userId));
  } catch (error) {
    if (error instanceof PlayError) return json({ error: error.message }, error.status);
    console.error(error);
    return json({ error: "Something went wrong. Try again." }, 500);
  }
}
