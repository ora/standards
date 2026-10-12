import { ImageResponse } from "next/og";
import { content } from "@/lib/content";
import { BRAND, posterFont } from "@/lib/brand";
import type { JobId } from "@/lib/schema";
import { type Standard, jobs, standardsForJob } from "@/lib/standards";

/** Every share image is 1200 x 630, the size Open Graph and X expect. */
export const OG_SIZE = { width: 1200, height: 630 };

/**
 * One frame for every share image: the site name and title over a rule, then
 * the page's own content. next/og lays out fragments as rows, so pass the
 * content as one <OgBody> rather than a fragment.
 */
export function ogImage(children: React.ReactNode): ImageResponse {
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
          }}
        >
          <span>{content.siteName}</span>
          <span style={{ textTransform: "uppercase" }}>{content.tagline}</span>
        </div>
        {children}
      </div>
    ),
    { ...OG_SIZE, fonts: [{ name: "Archivo Black", data: posterFont(), weight: 400, style: "normal" }] },
  );
}

/** The content column under the frame's rule. */
export function OgBody({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>{children}</div>;
}

/** The map in one strip: a black bar per job, a chip per standard, real traffic in the accent. */
export function JobsStrip({ standards, current }: { standards: Standard[]; current?: { job: JobId; id: string } }) {
  return (
    <div style={{ display: "flex", gap: 12, marginTop: "auto" }}>
      {jobs.map((job) => {
        const dim = current !== undefined && current.job !== job.id;
        return (
          <div key={job.id} style={{ display: "flex", flexDirection: "column", flex: 1, gap: 6, ...(dim ? { opacity: 0.35 } : {}) }}>
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
                    border: `3px ${s.status === "draft" ? "dashed" : "solid"} ${BRAND.ink}`,
                    backgroundColor: s.status === "production" ? BRAND.accent : BRAND.card,
                    ...(current?.id === s.id ? { boxShadow: `4px 4px 0 ${BRAND.ink}` } : {}),
                    fontSize: 17,
                  }}
                >
                  {s.name}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
