"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useState } from "react";
import { supabasePublicEnv } from "@/lib/supabase-env";

function browserClient() {
  const env = supabasePublicEnv();
  return env ? createBrowserClient(env.url, env.anonKey) : undefined;
}

function callbackUrl(): string {
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent("/play?deck=expert")}`;
}

/** GitHub, Google or an emailed link. Each comes back through /auth/callback. */
export function SignIn() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function withProvider(provider: "github" | "google") {
    const client = browserClient();
    if (!client) return setState("error");
    const { error } = await client.auth.signInWithOAuth({ provider, options: { redirectTo: callbackUrl() } });
    if (error) setState("error");
  }

  async function withEmail(event: React.FormEvent) {
    event.preventDefault();
    const client = browserClient();
    if (!client) return setState("error");
    setState("sending");
    const { error } = await client.auth.signInWithOtp({ email, options: { emailRedirectTo: callbackUrl() } });
    setState(error ? "error" : "sent");
  }

  if (state === "sent") {
    return (
      <p className="signin__sent" role="status">
        Check <strong>{email}</strong> for a sign-in link. It brings you straight back here.
      </p>
    );
  }

  return (
    <div className="signin">
      <div className="signin__providers">
        <button type="button" className="button" onClick={() => withProvider("github")}>
          GitHub
        </button>
        <button type="button" className="button" onClick={() => withProvider("google")}>
          Google
        </button>
      </div>
      <form className="signin__email" onSubmit={withEmail}>
        <label className="visually-hidden" htmlFor="signin-email">
          Email
        </label>
        <input
          id="signin-email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit" className="button" disabled={state === "sending"}>
          {state === "sending" ? "Sending" : "Email me a link"}
        </button>
      </form>
      {state === "error" && (
        <p className="signin__error" role="alert">
          Sign-in didn&apos;t start. Try again, or another way.
        </p>
      )}
      <p className="signin__note">
        Only your GitHub handle, or your first name and an initial, appear on the leaderboard. Never your email.
      </p>
    </div>
  );
}
