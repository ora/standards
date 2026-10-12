import { statusLabel } from "@/lib/content";
import type { StatusId } from "@/lib/schema";

/** A status mark with its label: filled for real traffic, half for early use, dashed for a draft. */
export function StatusBadge({ status, variant = "plain" }: { status: StatusId; variant?: "plain" | "pill" }) {
  return (
    <span className={`status status--${status}${variant === "pill" ? " status--pill" : ""}`}>
      <span className="status__mark" aria-hidden="true" />
      {statusLabel(status)}
    </span>
  );
}
