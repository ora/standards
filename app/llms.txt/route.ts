import { content } from "@/lib/content";
import { currentSiteUrl } from "@/lib/site-url";
import { getStandards } from "@/lib/standards";

// Built from the content files at build time; nothing in it changes between deploys.
export const dynamic = "force-static";

/** A short index of the site for agents: one link per page, with a clause each. */
export function GET() {
  const base = currentSiteUrl().origin;
  const lines = [
    `# ${content.siteName}`,
    "",
    `> ${content.metadata.description}`,
    "",
    "## Standards",
    "",
    ...getStandards().map((s) => `- [${s.name}](${base}/standards/${s.id}): ${s.phrase}`),
    "",
    "## Pages",
    "",
    `- [Compare](${base}/compare): every standard side by side, grouped by job`,
    `- [Which one?](${base}/which): which standard fits a situation`,
    `- [Specs](${base}/specs): each spec's versions, the version Ora reviewed, and the latest upstream`,
    "",
    "## Data",
    "",
    `- [specs.json](${base}/specs.json): the spec registry as JSON; one spec at /specs/<id>.json`,
    `- [Spec registry](${content.repo.specsUrl}): the source repository, also published as @ora-ai/specs on npm`,
    "",
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
