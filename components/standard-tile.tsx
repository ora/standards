import Link from "next/link";
import type { Standard } from "@/lib/standards";
import { StatusBadge } from "./status-badge";

/** One standard as a poster tile. Real traffic is filled with the accent. */
export function StandardTile({ standard, headingLevel = 3 }: { standard: Standard; headingLevel?: 3 | 4 }) {
  const Heading = `h${headingLevel}` as const;
  return (
    <Link href={`/standards/${standard.id}`} className="tile" data-status={standard.status}>
      <span className="tile__number" aria-hidden="true">
        {String(standard.number).padStart(2, "0")}
      </span>
      <Heading className="tile__name">{standard.name}</Heading>
      <span className="tile__tagline">{standard.tagline}</span>
      <code className="tile__looks">{standard.looks_like}</code>
      <span className="tile__status">
        <StatusBadge status={standard.status} />
      </span>
    </Link>
  );
}
