import { content } from "@/lib/content";
import { BRAND } from "@/lib/brand";
import { JobsStrip, OG_SIZE, OgBody, ogImage } from "@/lib/og";
import { getJob, getStandard, getStandards } from "@/lib/standards";

export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return getStandards().map((standard) => ({ id: standard.id }));
}

export async function generateImageMetadata({ params }: { params: Promise<{ id: string }> }) {
  const standard = getStandard((await params).id);
  return [{ id: "card", size: OG_SIZE, contentType, alt: standard ? `${standard.name}: ${standard.analogy}` : content.metadata.image.alt }];
}

/** A standard's share image: its name, its picture and its status, with its place on the map. */
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const standards = getStandards();
  const standard = getStandard((await params).id) ?? standards[0]!;
  const job = getJob(standard.job);
  const production = standard.status === "production";
  return ogImage(
    <OgBody>
      <div style={{ display: "flex", marginTop: 22, fontSize: 20, textTransform: "uppercase", color: BRAND.muted }}>
        0{job.number} {job.name} / {String(standard.number).padStart(2, "0")}
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 24, marginTop: 6 }}>
        <span style={{ fontSize: standard.name.length > 9 ? 104 : 136, lineHeight: 0.9, letterSpacing: "-0.04em" }}>
          {standard.name}
        </span>
      </div>
      <div style={{ display: "flex", marginTop: 18, fontSize: 32, lineHeight: 1.1, maxWidth: 1000 }}>
        {standard.analogy}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 18, fontSize: 20 }}>
        <span
          style={{
            display: "flex",
            padding: "4px 10px",
            border: `3px ${standard.status === "draft" ? "dashed" : "solid"} ${BRAND.ink}`,
            backgroundColor: production ? BRAND.accent : BRAND.card,
            textTransform: "uppercase",
          }}
        >
          {content.statuses[standard.status].label}
        </span>
        <span style={{ color: BRAND.muted }}>{standard.status_note}</span>
      </div>
      <JobsStrip standards={standards} current={{ job: standard.job, id: standard.id }} />
    </OgBody>,
  );
}
