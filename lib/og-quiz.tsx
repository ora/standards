import { BRAND } from "./brand";
import { OgBody, ogImage } from "./og";

/** A quiz result's share image: the score, the grid, and a dare. */
export function quizShareImage({
  kicker,
  score,
  correct,
  total,
  results,
}: {
  kicker: string;
  score: number;
  correct: number;
  total: number;
  results: boolean[];
}) {
  const square = total > 12 ? 44 : 60;
  return ogImage(
    <OgBody>
      <div style={{ display: "flex", marginTop: 26, fontSize: 24, textTransform: "uppercase", color: BRAND.muted }}>{kicker}</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 20, marginTop: 4 }}>
        <span style={{ fontSize: 176, lineHeight: 0.9, letterSpacing: "-0.04em" }}>{score.toLocaleString("en-US")}</span>
        <span style={{ fontSize: 44, paddingBottom: 16 }}>PTS</span>
      </div>
      <div style={{ display: "flex", marginTop: 14, fontSize: 36 }}>
        {correct} of {total} right on the agentic web quiz
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: "auto" }}>
        {results.map((right, i) => (
          <div
            key={i}
            style={{
              width: square,
              height: square,
              border: `5px solid ${BRAND.ink}`,
              backgroundColor: right ? BRAND.accent : BRAND.ink,
            }}
          />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 22, fontSize: 26 }}>
        <span>Can you beat it?</span>
        <span style={{ backgroundColor: BRAND.accent, padding: "4px 12px" }}>ax.guide/play</span>
      </div>
    </OgBody>,
  );
}
