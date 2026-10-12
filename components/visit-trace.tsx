import { type Standard, jobs, standardsForJob } from "@/lib/standards";

/**
 * An agent's visit drawn like a request trace: the five jobs in order, each
 * with the standards that do it. Decorative on the home page; the map below
 * carries the same facts, so it is hidden from screen readers.
 */
export function VisitTrace({ standards }: { standards: Standard[] }) {
  return (
    <div className="trace" aria-hidden="true">
      <div className="trace__bar">
        <span className="trace__lights">
          <span />
          <span />
          <span />
        </span>
        <span className="trace__title">agent-visit.trace</span>
      </div>
      <ol className="trace__steps">
        {jobs.map((job, index) => (
          <li key={job.id} className="trace__step" data-job={job.id} style={{ "--i": index } as React.CSSProperties}>
            <span className="trace__node" />
            <span className="trace__time">+{String(index * 120).padStart(3, "0")}ms</span>
            <span className="trace__job">{job.name}</span>
            <span className="trace__verb">{job.verb}</span>
            <span className="trace__names">
              {standardsForJob(job.id, standards)
                .map((s) => s.name)
                .join(" · ")}
            </span>
          </li>
        ))}
      </ol>
      <div className="trace__done">
        <span className="trace__check">✓</span> job done
      </div>
    </div>
  );
}
