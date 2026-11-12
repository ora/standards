import { json } from "@/lib/play-route";
import { signOut } from "@/lib/supabase-server";

export async function POST() {
  await signOut();
  return json({ ok: true });
}
