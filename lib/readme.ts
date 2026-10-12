import { getJob, type Standard } from "./standards";

/** The README's table of standards sits between these two markers. */
export const README_START = "<!-- standards:start (generated from content/standards; run `npm run readme` to update) -->";
export const README_END = "<!-- standards:end -->";

/** The README's table of standards, built from the content files. */
export function readmeTable(standards: Standard[], siteUrl = "https://ax.guide"): string {
  const rows = standards.map((s) => {
    const name = s.full_name ? `**[${s.name}](${siteUrl}/standards/${s.id})**<br>${s.full_name}` : `**[${s.name}](${siteUrl}/standards/${s.id})**`;
    return `| ${String(s.number).padStart(2, "0")} | ${name} | ${getJob(s.job).name} | ${s.phrase} |`;
  });
  return ["| # | Standard | Job | In one phrase |", "| --- | --- | --- | --- |", ...rows].join("\n");
}

/** Replace the generated table in a README's text. Throws if the markers are missing. */
export function withReadmeTable(readme: string, table: string): string {
  const start = readme.indexOf(README_START);
  const end = readme.indexOf(README_END);
  if (start === -1 || end === -1 || end < start) throw new Error("README.md is missing the standards table markers");
  return `${readme.slice(0, start + README_START.length)}\n${table}\n${readme.slice(end)}`;
}
