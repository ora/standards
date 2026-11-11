import type { Metadata } from "next";
import Link from "next/link";
import { content, formatDate } from "@/lib/content";
import { getSpecStatus, publicSpecs, type PublicSpec } from "@/lib/specs";
import "../compare/compare.css";
import "./specs.css";

const copy = content.specs;

export const metadata: Metadata = {
  title: copy.title,
  description: copy.description,
  alternates: { canonical: "/specs" },
};

// Made again at most hourly (SPEC_STATUS_REVALIDATE), to pick up the registry's watch status.
export const revalidate = 3600;

function Versions({ spec }: { readonly spec: PublicSpec }) {
  if (spec.versions.length === 0) return <span className="compare-table__muted">{copy.noVersions}</span>;
  return (
    <ul className="spec-versions">
      {spec.versions.map((v) => (
        <li key={v.id} data-status={v.status}>
          {v.url ? <a href={v.url}>{v.label ?? v.id}</a> : <span>{v.label ?? v.id}</span>}{" "}
          <span className="spec-versions__status">{copy.status[v.status]}</span>
        </li>
      ))}
    </ul>
  );
}

function Reviewed({ spec }: { readonly spec: PublicSpec }) {
  const r = spec.reviewed;
  if (!r) return <span className="compare-table__muted">{copy.notReviewed}</span>;
  return (
    <>
      {r.url ? <a href={r.url}>{r.label}</a> : <span>{r.label}</span>}
      <span className="compare-table__note">
        {copy.read} <time dateTime={r.read}>{formatDate(r.read)}</time>
      </span>
    </>
  );
}

function Latest({ spec }: { readonly spec: PublicSpec }) {
  const { latest } = spec;
  const watched = spec.reviewed === null;
  if (latest.state === "unknown") return <span className="compare-table__muted">{copy.latest.unknown}</span>;
  if (latest.state === "same") return <span>{watched ? copy.latest.sameWatched : copy.latest.same}</span>;
  return (
    <>
      <strong className="spec-latest__changed">{watched ? copy.latest.changedWatched : copy.latest.changed}</strong>
      {latest.revision && (
        <span className="compare-table__note">
          <a href={latest.revision.url}>{latest.revision.label}</a>
        </span>
      )}
      <span className="compare-table__note">
        {latest.changes && <a href={latest.changes}>{copy.latest.whatChanged}</a>}
        {latest.changes && latest.issue && " · "}
        {latest.issue && <a href={latest.issue}>{copy.latest.issue}</a>}
        {latest.since && (
          <>
            {" "}
            {copy.latest.since} <time dateTime={latest.since}>{formatDate(latest.since)}</time>
          </>
        )}
      </span>
    </>
  );
}

export default async function SpecsPage() {
  const status = await getSpecStatus();
  const specs = publicSpecs(status, "");
  return (
    <div className="wrap compare">
      <header className="page-intro">
        <p className="kicker">{copy.kicker}</p>
        <h1 className="page-title">{copy.heading}</h1>
        <p className="lede">{copy.lede}</p>
        <p className="spec-links">
          <a href={content.repo.specsUrl}>{copy.registryLink}</a>
          <a href="/specs.json">{copy.jsonLink}</a>
        </p>
        <p className="compare-table__muted">
          {status ? (
            <>
              {copy.checkedAt} <time dateTime={status.checked_at}>{formatDate(status.checked_at.slice(0, 10))}</time>.
            </>
          ) : (
            copy.neverChecked
          )}
        </p>
      </header>

      <div className="table-scroll">
        <table className="compare-table">
          <thead>
            <tr>
              {Object.values(copy.columns).map((column) => (
                <th key={column} scope="col">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {specs.map((spec) => (
              <tr key={spec.id} id={spec.id}>
                <th scope="row" data-label={copy.columns.spec}>
                  <a href={spec.spec_url} className="spec-name">
                    {spec.name}
                  </a>
                  {spec.standard && (
                    <span className="compare-table__note">
                      <Link href={spec.standard}>{copy.standardLink}</Link>
                    </span>
                  )}
                </th>
                <td data-label={copy.columns.versions}>
                  <Versions spec={spec} />
                </td>
                <td data-label={copy.columns.reviewed}>
                  <Reviewed spec={spec} />
                </td>
                <td data-label={copy.columns.latest}>
                  <Latest spec={spec} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
