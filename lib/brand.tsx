import { readFileSync } from "node:fs";
import { join } from "node:path";

// next/og cannot read CSS variables, so the palette of app/globals.css is
// copied here for the icon and the share image. Keep them in step.
export const BRAND = {
  paper: "#f2efe6",
  card: "#fbf9f3",
  ink: "#0c0c0c",
  muted: "#57534a",
  accent: "#ff5b1f",
} as const;

/** Archivo Black (SIL OFL), for share images: next/og needs a static font file. */
export function posterFont(): ArrayBuffer {
  const file = readFileSync(join(process.cwd(), "assets", "fonts", "ArchivoBlack-Regular.ttf"));
  return file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer;
}

/** The mark: an ink square with an accent quarter, like a poster's corner. */
export function BrandMark({ size }: { size: number }) {
  const inset = Math.round(size * 0.14);
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", backgroundColor: BRAND.paper, padding: inset }}>
      <div style={{ flex: 1, display: "flex", alignItems: "flex-end", justifyContent: "flex-end", backgroundColor: BRAND.ink }}>
        <div style={{ width: "50%", height: "50%", backgroundColor: BRAND.accent }} />
      </div>
    </div>
  );
}
