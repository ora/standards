import { ImageResponse } from "next/og";
import { content, fillCounts, homeContent } from "@/lib/content";
import { BRAND, posterFont } from "@/lib/brand";
import { getStandards, jobs, standardsForJob } from "@/lib/standards";

export const alt = content.metadata.image.alt;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The site's preview image: the poster headline over a strip of the map. */
export default function Image() {
  const standards = getStandards();
  const counts = {
    standards: standards.length,
    jobs: jobs.length,
    production: standards.filter((s) => s.status === "production").length,
  };
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "48px 56px",
          backgroundColor: BRAND.paper,
          color: BRAND.ink,
          fontFamily: "Archivo Black",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            paddingBottom: 14,
            borderBottom: `5px solid ${BRAND.ink}`,
            fontSize: 22,
            textTransform: "uppercase",
          }}
        >
          <span>{content.siteName}</span>
          <span>An open field guide</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 26, fontSize: 70, lineHeight: 0.95 }}>
          {homeContent.headline.map((line) => (
            <div key={line.text} style={{ display: "flex" }}>
              <span
                style={{
                  textTransform: "uppercase",
                  letterSpacing: "-0.03em",
                  ...(line.highlight
                    ? { backgroundColor: BRAND.accent, padding: "4px 12px 0 8px", marginTop: 8, marginLeft: -8 }
                    : {}),
                }}
              >
                {fillCounts(line.text, counts)}
              </span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: "auto" }}>
          {jobs.map((job) => (
            <div key={job.id} style={{ display: "flex", flexDirection: "column", flex: 1, gap: 6 }}>
              <div
                style={{
                  display: "flex",
                  padding: "4px 10px",
                  backgroundColor: BRAND.ink,
                  color: BRAND.paper,
                  fontSize: 18,
                  textTransform: "uppercase",
                }}
              >
                {job.name}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {standardsForJob(job.id, standards).map((s) => (
                  <div
                    key={s.id}
                    style={{
                      display: "flex",
                      padding: "3px 8px",
                      border: `3px solid ${BRAND.ink}`,
                      backgroundColor: s.status === "production" ? BRAND.accent : BRAND.card,
                      fontSize: 17,
                    }}
                  >
                    {s.name}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Archivo Black", data: posterFont(), weight: 400, style: "normal" }] },
  );
}
