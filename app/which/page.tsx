import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { guide } from "@/lib/content";
import { getStandards } from "@/lib/standards";
import "./which.css";

export const metadata: Metadata = {
  title: "Which one do I need?",
  description: "Start from what you're building and find the agentic-web standard to look at first.",
  alternates: { canonical: "/which" },
};

export default function WhichPage() {
  const byId = new Map(getStandards().map((s) => [s.id, s]));
  return (
    <div className="wrap which">
      <header className="page-intro">
        <p className="kicker">The cheat sheet</p>
        <h1 className="page-title">{guide.heading}</h1>
        <p className="lede">{guide.lede}</p>
      </header>

      <ol className="which__list">
        {guide.items.map((item, index) => {
          return (
            <li key={item.situation} className="which__item">
              <span className="which__number" aria-hidden="true">
                {index + 1}
              </span>
              <div className="which__situation">
                <p>{item.situation}</p>
                {item.note && <p className="which__note">{item.note}</p>}
              </div>
              <span className="which__arrow" aria-hidden="true">
                →
              </span>
              <ul className="which__answers" aria-label="Look at">
                {item.standards.map((id) => {
                  const s = byId.get(id);
                  if (!s) return null;
                  return (
                    <li key={id}>
                      <Link href={`/standards/${s.id}`} className="which__answer" data-status={s.status}>
                        <span className="which__answer-name">{s.name}</span>
                        <StatusBadge status={s.status} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
