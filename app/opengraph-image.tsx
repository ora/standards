import { content, homeContent } from "@/lib/content";
import { BRAND } from "@/lib/brand";
import { JobsStrip, OG_SIZE, OgBody, ogImage } from "@/lib/og";
import { getStandards } from "@/lib/standards";

export const alt = content.metadata.image.alt;
export const size = OG_SIZE;
export const contentType = "image/png";

/** The share image for every page without its own: the title over the map. */
export default function Image() {
  const standards = getStandards();
  return ogImage(
    <OgBody>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          marginTop: 34,
          fontSize: 92,
          lineHeight: 0.92,
          letterSpacing: "-0.03em",
          textTransform: "uppercase",
        }}
      >
        {homeContent.title.map((line) => (
          <div key={line.text} style={{ display: "flex" }}>
            <span
              style={
                line.highlight
                  ? { backgroundColor: BRAND.accent, padding: "6px 14px 0 8px", marginTop: 8, marginLeft: -8 }
                  : {}
              }
            >
              {line.text}
            </span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", marginTop: 28, fontSize: 26, color: BRAND.muted }}>{content.metadata.image.line}</div>
      <JobsStrip standards={standards} />
    </OgBody>,
  );
}
