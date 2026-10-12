// next/og cannot read CSS variables, so the dark palette of app/globals.css
// is copied here for the icon and the share image. Keep them in step.
export const BRAND = {
  paper: "#0d0d10",
  surface: "#16161b",
  ink: "#efede6",
  muted: "#a3a097",
  rule: "#2a2a31",
  jobs: { find: "#6f96ff", act: "#a586ff", identity: "#ff6fa6", shop: "#ff9a4d", pay: "#3fd0dc" },
  status: { production: "#3ddc84", early: "#ffbf3c", draft: "#8e8b83" },
} as const;

/** Five bars, one per job, rising like a skyline. */
export function BrandMark({ size }: { size: number }) {
  const heights = [0.32, 0.52, 0.66, 0.44, 0.58];
  const colors = Object.values(BRAND.jobs);
  const bar = size * 0.11;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        gap: size * 0.045,
        paddingBottom: size * 0.2,
        backgroundColor: BRAND.paper,
        borderRadius: size * 0.22,
      }}
    >
      {heights.map((h, i) => (
        <div
          key={i}
          style={{ width: bar, height: size * h, borderRadius: bar / 2.5, backgroundColor: colors[i] }}
        />
      ))}
    </div>
  );
}
