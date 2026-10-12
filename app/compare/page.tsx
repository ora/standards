import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { numberWord, pairs } from "@/lib/content";
import { getStandards, jobs, standardsForJob } from "@/lib/standards";
import "./compare.css";

export const metadata: Metadata = {
  title: "Compare",
  description: "Every agentic-web standard side by side, grouped by job, and the pairs people mix up.",
  alternates: { canonical: "/compare" },
};

export default function ComparePage() {
  const standards = getStandards();
  const byId = new Map(standards.map((s) => [s.id, s]));
  return (
    <div className="wrap compare">
      <header className="page-intro">
        <p className="kicker">Side by side</p>
        <h1 className="page-title">All {numberWord(standards.length)} on one screen</h1>
        <p className="lede">Grouped by the job each one does for an AI agent. Pick a name for the full story.</p>
      </header>

      <div className="table-scroll">
        <table className="compare-table">
          <thead>
            <tr>
              <th scope="col">Standard</th>
              <th scope="col">Job in one phrase</th>
              <th scope="col">When to use it</th>
              <th scope="col">Who&apos;s behind it</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          {jobs.map((job) => (
            <tbody key={job.id}>
              <tr className="compare-table__group">
                <th scope="colgroup" colSpan={5}>
                  <span className="bar">
                    <span className="bar__number">0{job.number}</span>
                    {job.name}
                  </span>
                </th>
              </tr>
              {standardsForJob(job.id, standards).map((s) => (
                <tr key={s.id} data-status={s.status}>
                  <th scope="row" data-label="Standard">
                    <Link href={`/standards/${s.id}`} className="compare-table__name">
                      {s.name}
                    </Link>
                  </th>
                  <td data-label="Job in one phrase">{s.phrase}</td>
                  <td data-label="When to use it" className="compare-table__muted">
                    {s.when_to_use}
                  </td>
                  <td data-label="Who's behind it" className="compare-table__muted">
                    {s.backers}
                  </td>
                  <td data-label="Status">
                    <StatusBadge status={s.status} />
                    <span className="compare-table__note">{s.status_note}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>

      <section className="pairs" aria-labelledby="pairs-title">
        <div className="section-head">
          <h2 id="pairs-title" className="section-title">
            The ones people mix up
          </h2>
          <p className="lede">Same neighbourhood, different jobs.</p>
        </div>
        <ul className="pairs__list">
          {pairs.map((pair) => (
            <li key={pair.id} className="pair">
              <h3 className="pair__title">{pair.title}</h3>
              <p className="pair__summary">{pair.summary}</p>
              <ul className="pair__sides">
                {pair.sides.map((side, index) => {
                  const s = byId.get(side.id);
                  if (!s) return null;
                  return (
                    <li key={side.id} className="pair__side" data-status={s.status}>
                      {index > 0 && (
                        <span className="pair__vs" aria-hidden="true">
                          vs
                        </span>
                      )}
                      <Link href={`/standards/${s.id}`} className="pair__name">
                        {s.name}
                      </Link>
                      <p>{side.says}</p>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
