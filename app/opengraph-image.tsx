import { content, fillCounts, homeContent } from "@/lib/content";
import { BRAND } from "@/lib/brand";
import { JobsStrip, OG_SIZE, OgBody, ogImage } from "@/lib/og";
import { getStandards, jobs } from "@/lib/standards";

export const alt = content.metadata.image.alt;
export const size = OG_SIZE;
export const contentType = "image/png";

/** The share image for every page without its own: the title and the counts over the map. */
export default function Image() {
  const standards = getStandards();
  const counts = {
    standards: standards.length,
    jobs: jobs.length,
    production: standards.filter((s) => s.status === "production").length,
  };
  return ogImage(
    <OgBody>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          marginTop: 26,
          fontSize: 84,
          lineHeight: 0.92,
          letterSpacing: "-0.03em",
          textTransform: "uppercase",
        }}
      >
        {homeContent.title.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", marginTop: 20, fontSize: 30, textTransform: "uppercase" }}>
        {homeContent.summary.map((line) => (
          <span
            key={line.text}
            style={{
              marginRight: 12,
              ...(line.highlight ? { backgroundColor: BRAND.accent, padding: "2px 8px 0" } : {}),
            }}
          >
            {fillCounts(line.text, counts)}
          </span>
        ))}
      </div>
      <JobsStrip standards={standards} />
    </OgBody>,
  );
}
