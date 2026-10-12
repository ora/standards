import Link from "next/link";
import { MapBoard } from "@/components/map-board";
import { MapFilter } from "@/components/map-filter";
import { VisitTrace } from "@/components/visit-trace";
import { content, formatDate, homeContent } from "@/lib/content";
import { STATUS_IDS } from "@/lib/schema";
import { getStandards, jobs, latestVerified } from "@/lib/standards";
import "./home.css";

export default function HomePage() {
  const standards = getStandards();
  const home = homeContent;
  const count = (status: string) => standards.filter((s) => s.status === status).length;
  const inProduction = standards.filter((s) => s.status === "production");
  const filterOptions = [
    { id: "all" as const, label: home.filterAll, count: standards.length },
    ...STATUS_IDS.map((id) => ({ id, label: content.statuses[id].label, count: count(id) })),
  ];

  return (
    <div className="home">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__grid" aria-hidden="true" />
        <div className="wrap hero__inner">
          <div className="hero__copy">
            <p className="eyebrow">
              <span className="hero__pulse" aria-hidden="true" />
              {home.eyebrow} · Status as of {formatDate(latestVerified(standards))}
            </p>
            <h1 id="hero-title" className="hero__title">
              The agentic web, <em>standard by standard</em>
            </h1>
            <p className="lede hero__lede">{home.lede}</p>
            <dl className="hero__stats">
              <div>
                <dt>Standards</dt>
                <dd>{standards.length}</dd>
              </div>
              <div>
                <dt>Jobs</dt>
                <dd>{jobs.length}</dd>
              </div>
              <div>
                <dt>Carry real traffic</dt>
                <dd>
                  {inProduction.length}
                  <span className="hero__stat-names">{inProduction.map((s) => s.name).join(", ")}</span>
                </dd>
              </div>
            </dl>
            <div className="hero__actions">
              <a href="#map" className="button button--primary">
                Explore the map <span className="arrow" aria-hidden="true">↓</span>
              </a>
              <Link href="/contribute" className="button">
                Add or fix a standard
              </Link>
            </div>
          </div>
          <VisitTrace standards={standards} />
        </div>
      </section>

      <section id="map" className="wrap home__map" aria-labelledby="map-title">
        <div className="section-head">
          <h2 id="map-title" className="section-title">
            {home.mapHeading}
          </h2>
          <p className="lede">{home.mapLede}</p>
        </div>
        <MapFilter label={home.filterLabel} options={filterOptions}>
          <MapBoard standards={standards} />
        </MapFilter>
      </section>

      <section className="wrap patterns" aria-labelledby="patterns-title">
        <div className="section-head">
          <h2 id="patterns-title" className="section-title">
            {home.patternsHeading}
          </h2>
        </div>
        <ol className="patterns__list">
          {home.patterns.map((pattern, index) => (
            <li key={pattern.title} className="patterns__item">
              <span className="patterns__number" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="patterns__title">{pattern.title}</h3>
              <p className="patterns__body">{pattern.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="wrap next" aria-labelledby="next-title">
        <h2 id="next-title" className="visually-hidden">
          {home.next.heading}
        </h2>
        <ul className="next__list">
          {home.next.items.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="next__card">
                <span className="next__title">
                  {item.title} <span className="arrow" aria-hidden="true">→</span>
                </span>
                <span className="next__body">{item.body}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
