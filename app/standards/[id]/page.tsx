import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReportErrorLink } from "@/components/report-error-link";
import { StandardTile } from "@/components/standard-tile";
import { StatusBadge } from "@/components/status-badge";
import { content, editHref, formatDate } from "@/lib/content";
import { renderInline, renderMarkdown } from "@/lib/markdown";
import { daysSince, getJob, getStandard, getStandards } from "@/lib/standards";
import "../standard.css";

type Props = { params: Promise<{ id: string }> };

// Every standard is a file, so every page is made at build time.
export const dynamicParams = false;

export function generateStaticParams() {
  return getStandards().map((standard) => ({ id: standard.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const standard = getStandard((await params).id);
  if (!standard) return {};
  const title = standard.full_name ? `${standard.name}: ${standard.full_name}` : standard.name;
  return {
    title,
    description: `${standard.analogy} ${standard.phrase}. ${content.statuses[standard.status].label}: ${standard.status_note}.`,
    alternates: { canonical: `/standards/${standard.id}` },
  };
}

export default async function StandardPage({ params }: Props) {
  const standard = getStandard((await params).id);
  if (!standard) notFound();

  const all = getStandards();
  const job = getJob(standard.job);
  const previous = all[standard.number - 2];
  const next = all[standard.number];
  const related = standard.related.flatMap((r) => {
    const target = all.find((s) => s.id === r.id);
    return target ? [{ ...r, standard: target }] : [];
  });
  const stale = daysSince(standard.last_verified) > content.staleAfterDays;
  const file = `content/standards/${standard.id}.md`;

  return (
    <article className="standard">
      <div className="wrap">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/#map">Map</Link>
          <span aria-hidden="true">/</span>
          <span>
            0{job.number} {job.name}
          </span>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{String(standard.number).padStart(2, "0")}</span>
        </nav>

        <header className="standard__head" data-status={standard.status}>
          <h1 className="standard__name">{standard.name}</h1>
          {standard.full_name && <p className="standard__full">{standard.full_name}</p>}
          <p className="standard__analogy">{standard.analogy}</p>
          <div className="standard__status">
            <StatusBadge status={standard.status} variant="pill" />
            <span className="standard__status-note">{standard.status_note}</span>
          </div>
        </header>

        <div className="standard__layout">
          <aside className="facts" aria-label="At a glance">
            <dl>
              <div>
                <dt>Job</dt>
                <dd>{standard.phrase}</dd>
              </div>
              <div>
                <dt>Use it when</dt>
                <dd>{standard.when_to_use}</dd>
              </div>
              <div>
                <dt>Behind it</dt>
                <dd>{standard.backers}</dd>
              </div>
              <div>
                <dt>Agents meet</dt>
                <dd>
                  <code>{standard.looks_like}</code>
                </dd>
              </div>
              <div>
                <dt>Sources</dt>
                <dd>
                  <ul className="facts__links">
                    {standard.links.map((link) => (
                      <li key={link.url}>
                        <a href={link.url} rel="noopener">
                          {link.label} ↗
                        </a>
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            </dl>
          </aside>

          <div className="standard__main">
            <section className="reality" data-status={standard.status} aria-labelledby="reality-title">
              <h2 id="reality-title" className="reality__title">
                Reality check
              </h2>
              <p dangerouslySetInnerHTML={{ __html: renderInline(standard.reality_check) }} />
            </section>

            <div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(standard.body) }} />

            <footer className="verified">
              <p>
                {stale && <strong className="verified__stale">May be out of date. </strong>}
                Last checked against its sources on{" "}
                <time dateTime={standard.last_verified}>{formatDate(standard.last_verified)}</time>. These standards
                move fast; if something changed, please help.
              </p>
              <p className="verified__actions">
                <a href={editHref(file)} className="button">
                  Edit on GitHub
                </a>
                <ReportErrorLink label="Report an error" />
              </p>
            </footer>
          </div>
        </div>

        {related.length > 0 && (
          <section className="related" aria-labelledby="related-title">
            <h2 id="related-title" className="bar related__bar">
              Often mixed up with, or used next to
            </h2>
            <ul className="related__list">
              {related.map((r) => (
                <li key={r.id} className="related__item">
                  <StandardTile standard={r.standard} />
                  <p className="related__note">{r.note}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <nav className="pager" aria-label="Previous and next standard">
          {previous ? (
            <Link href={`/standards/${previous.id}`} className="pager__link">
              <span className="pager__label">← Previous</span>
              <span className="pager__name">{previous.name}</span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link href={`/standards/${next.id}`} className="pager__link pager__link--next">
              <span className="pager__label">Next →</span>
              <span className="pager__name">{next.name}</span>
            </Link>
          ) : (
            <Link href="/compare" className="pager__link pager__link--next">
              <span className="pager__label">Next →</span>
              <span className="pager__name">Compare all</span>
            </Link>
          )}
        </nav>
      </div>
    </article>
  );
}
