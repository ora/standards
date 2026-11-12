import type { NextConfig } from "next";

/** Sent on every response. */
const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Do not let `next dev` write AGENTS.md and CLAUDE.md into the repo.
  agentRules: false,
  // The quiz's server routes read standard names and the share image font
  // from disk at request time, so ship those files with them.
  outputFileTracingIncludes: {
    "/api/play/**": ["./content/standards/**"],
    "/play/**": ["./content/standards/**", "./assets/fonts/**"],
  },
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
