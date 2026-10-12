import { type Standard, jobs, standardsForJob } from "@/lib/standards";
import { StandardTile } from "./standard-tile";

/** The five jobs as columns, left to right as an agent's visit. */
export function MapBoard({ standards }: { standards: Standard[] }) {
  return (
    <ol className="board">
      {jobs.map((job) => (
        <li key={job.id} className="board__column">
          <h3 className="bar board__bar">
            <span className="bar__number">0{job.number}</span>
            {job.name}
          </h3>
          <p className="board__description">{job.description}</p>
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
