export interface SiteUrlEnv {
  /** NEXT_PUBLIC_VERCEL_ENV: "production", "preview" or "development" on Vercel. */
  vercelEnv?: string;
  /** NEXT_PUBLIC_VERCEL_BRANCH_URL: the preview's branch host, without a scheme. */
  branchUrl?: string;
  /** NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL: the production host, without a scheme. */
  productionUrl?: string;
  /** NEXT_PUBLIC_SITE_URL: an address set by hand. Wins over the production host. */
  siteUrl?: string;
}

function parse(value: string | undefined): URL | null {
  const text = value?.trim();
  if (!text) return null;
  try {
    return new URL(/^https?:\/\//.test(text) ? text : `https://${text}`);
  } catch {
    return null;
  }
}

/**
 * The site's own address, for canonical links and preview images. A Vercel
 * preview uses its branch address; otherwise NEXT_PUBLIC_SITE_URL, then
 * Vercel's production host, then localhost.
 */
export function siteUrl(env: SiteUrlEnv): URL {
  if (env.vercelEnv === "preview") {
    const url = parse(env.branchUrl);
    if (url) return url;
  }
  return parse(env.siteUrl) ?? parse(env.productionUrl) ?? new URL("http://localhost:3000");
}

/** The address of this build, read from the environment. */
export function currentSiteUrl(): URL {
  return siteUrl({
    vercelEnv: process.env.NEXT_PUBLIC_VERCEL_ENV,
    branchUrl: process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL,
    productionUrl: process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
  });
}
