import Link from "next/link";
import { MapBoard } from "@/components/map-board";
import { content, fillCounts, formatDate, homeContent } from "@/lib/content";
import { STATUS_IDS } from "@/lib/schema";
import { getStandards, jobs, latestVerified } from "@/lib/standards";
import "./home.css";

export default function HomePage() {
  const standards = getStandards();
  const home = homeContent;
  const counts = {
    standards: standards.length,
    jobs: jobs.length,
    production: standards.filter((s) => s.status === "production").length,
  };

  return (
    <div className="home">
      <section className="wrap hero" aria-labelledby="hero-title">
        <p className="kicker hero__kicker">
          <span>{home.kicker}</span>
          <span>Status as of {formatDate(latestVerified(standards))}</span>
        </p>
        <h1 id="hero-title" className="hero__title">
          {home.headline.map((line) => (
            <span key={line.text} className="hero__line">
              {line.highlight ? <mark>{fillCounts(line.text, counts)}</mark> : fillCounts(line.text, counts)}
            </span>
          ))}
        </h1>
        <div className="hero__foot">
          <p className="lede">{home.lede}</p>
          <div className="hero__actions">
            <a href="#map" className="button button--primary">
              See the map ↓
            </a>
            <Link href="/which" className="button">
              Which one do I need?
            </Link>
          </div>
        </div>
      </section>

      <section id="map" className="wrap home__map" aria-labelledby="map-title">
        <div className="map-head">
          <h2 id="map-title" className="section-title">
            {home.mapHeading}
          </h2>
          <p className="lede">{home.mapLede}</p>
          <ul className="legend" aria-label={home.legendLabel}>
            {STATUS_IDS.map((id) => (
              <li key={id} className="legend__item" data-status={id}>
                <span className="legend__swatch" aria-hidden="true" />
                <span>
                  <strong>{content.statuses[id].label}</strong> {content.statuses[id].description}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <MapBoard standards={standards} />
      </section>

      <section className="wrap patterns" aria-labelledby="patterns-title">
        <h2 id="patterns-title" className="section-title patterns__title">
          {home.patternsHeading}
        </h2>
        <ol className="patterns__list">
          {home.patterns.map((pattern, index) => (
            <li key={pattern.title} className="patterns__item">
              <span className="patterns__number" aria-hidden="true">
                {index + 1}
              </span>
              <h3 className="patterns__heading">{pattern.title}</h3>
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
                <span className="next__title">{item.title}</span>
                <span className="next__body">{item.body}</span>
                <span className="next__arrow" aria-hidden="true">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
