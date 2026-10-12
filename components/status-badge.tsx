import { statusLabel } from "@/lib/content";
import type { StatusId } from "@/lib/schema";

/** A status dot, with its label shown or read out. */
export function StatusBadge({
  status,
  variant = "plain",
  hideLabel = false,
}: {
  status: StatusId;
  variant?: "plain" | "pill";
  hideLabel?: boolean;
}) {
  const label = statusLabel(status);
  return (
    <span className={`status status--${status}${variant === "pill" ? " status--pill" : ""}`}>
      <span className="status__dot" aria-hidden="true" />
      {hideLabel ? <span className="visually-hidden">{label}</span> : label}
    </span>
  );
}
