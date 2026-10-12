import { type Standard, jobs, standardsForJob } from "@/lib/standards";
import { StandardTile } from "./standard-tile";

/** The five jobs as columns, left to right as an agent's visit. */
export function MapBoard({ standards }: { standards: Standard[] }) {
  return (
    <ol className="board">
      {jobs.map((job) => (
        <li key={job.id} className="board__column" data-job={job.id}>
          <div className="board__head">
            <span className="board__number" aria-hidden="true">
              {job.number}
            </span>
            <h3 className="board__name">
              <span className="visually-hidden">{job.number}. </span>
              {job.name}
            </h3>
            <p className="board__description">{job.description}</p>
          </div>
          <ul className="board__tiles">
            {standardsForJob(job.id, standards).map((standard) => (
              <li key={standard.id}>
                <StandardTile standard={standard} headingLevel={4} />
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}
