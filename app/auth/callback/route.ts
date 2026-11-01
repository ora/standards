import { NextResponse } from "next/server";
import { safeNext } from "@/lib/quiz";
import { exchangeAuthCode } from "@/lib/supabase-server";

/** Where GitHub, Google and email sign-in links land: set the session, go back to the game. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));
  const ok = code ? await exchangeAuthCode(code) : false;
  const target = new URL(next, url.origin);
  if (!ok) target.searchParams.set("signin", "failed");
  return NextResponse.redirect(target);
}
