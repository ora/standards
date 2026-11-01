import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { supabasePublicEnv } from "./supabase-env";

/** True when sign-in, expert runs and the leaderboard can work. */
export function playBackendEnabled(): boolean {
  return supabasePublicEnv() !== undefined && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * The visitor's session, from their cookies. In a route handler it also
 * writes refreshed tokens back; in a server component, where cookies are
 * read-only, the browser client refreshes them instead.
 */
async function sessionClient(): Promise<SupabaseClient | undefined> {
  const env = supabasePublicEnv();
  if (!env) return undefined;
  const store = await cookies();
  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Server components can't set cookies; route handlers can.
        }
      },
    },
  });
}

/** The signed-in user's id, checked with Supabase Auth, or undefined. */
export async function currentUserId(): Promise<string | undefined> {
  const client = await sessionClient();
  if (!client) return undefined;
  const { data } = await client.auth.getUser();
  return data.user?.id;
}

/** Trade the code from a sign-in link or OAuth redirect for a session cookie. */
export async function exchangeAuthCode(code: string): Promise<boolean> {
  const client = await sessionClient();
  if (!client) return false;
  const { error } = await client.auth.exchangeCodeForSession(code);
  return !error;
}

export async function signOut(): Promise<void> {
  const client = await sessionClient();
  await client?.auth.signOut();
}

let admin: SupabaseClient | undefined;

/**
 * The server's own client, with the service role key. Every quiz table has
 * row level security and no policies, so only this client can read them.
 * Never send its key or its results unfiltered to a browser.
 */
export function adminClient(): SupabaseClient | undefined {
  const env = supabasePublicEnv();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!env || !key) return undefined;
  admin ??= createClient(env.url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return admin;
}
