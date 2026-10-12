import type { MetadataRoute } from "next";
import { currentSiteUrl } from "@/lib/site-url";
import { getStandards } from "@/lib/standards";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = currentSiteUrl();
  const at = (path: string) => new URL(path, base).toString();
  return [
    ...["/", "/compare", "/which", "/contribute"].map((path) => ({ url: at(path) })),
    ...getStandards().map((s) => ({ url: at(`/standards/${s.id}`), lastModified: s.last_verified })),
  ];
}
