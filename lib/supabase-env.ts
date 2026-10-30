/**
 * Supabase's public settings. Next.js inlines NEXT_PUBLIC_ variables into the
 * browser bundle at build time. Without them the site still builds and the
 * open game still plays; sign-in, expert runs and the leaderboard stay off.
 */
export function supabasePublicEnv(): { url: string; anonKey: string } | undefined {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && anonKey ? { url, anonKey } : undefined;
}
