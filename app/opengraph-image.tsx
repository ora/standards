import { ImageResponse } from "next/og";
import { content } from "@/lib/content";
import { BRAND } from "@/lib/brand";
import { getStandards, jobs, standardsForJob } from "@/lib/standards";

export const alt = content.metadata.image.alt;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The site's preview image: the title over a small copy of the map. */
export default function Image() {
  const standards = getStandards();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "56px 64px",
          backgroundColor: BRAND.paper,
          color: BRAND.ink,
        }}
      >
        <div style={{ display: "flex", fontSize: 24, color: BRAND.muted }}>{content.siteName}</div>
        <div style={{ display: "flex", fontSize: 68, lineHeight: 1.05, marginTop: 18, letterSpacing: "-0.02em" }}>
          {content.metadata.image.heading}
        </div>
        <div style={{ display: "flex", fontSize: 28, color: BRAND.muted, marginTop: 14 }}>
          {content.metadata.image.line}
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: "auto" }}>
          {jobs.map((job) => (
            <div
              key={job.id}
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                gap: 8,
                padding: 14,
                borderRadius: 16,
                backgroundColor: BRAND.surface,
                borderTop: `4px solid ${BRAND.jobs[job.id]}`,
              }}
            >
              <div style={{ display: "flex", fontSize: 20, color: BRAND.jobs[job.id] }}>
                {job.number} · {job.name}
              </div>
              {standardsForJob(job.id, standards).map((s) => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 20 }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 10,
                      backgroundColor: BRAND.status[s.status],
                    }}
                  />
                  {s.name}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
