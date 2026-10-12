import { content } from "@/lib/content";
import { ReportErrorLink } from "./report-error-link";

export function SiteFooter() {
  const { footer } = content;
  const { license, maintainedBy } = footer;
  return (
    <footer className="site-footer">
      <div className="wrap site-footer__inner">
        <p className="site-footer__name" aria-hidden="true">
          {content.siteName}
        </p>
        <div className="site-footer__cols">
          <div className="site-footer__about">
            <p>{footer.about}</p>
            <p>
              {maintainedBy.before}
              <a href={maintainedBy.href}>{maintainedBy.text}</a>
              {maintainedBy.after}{" "}
              {license.before}
              <a href={license.code.href}>{license.code.text}</a>
              {license.middle}
              <a href={license.content.href}>{license.content.text}</a>
              {license.after}
            </p>
          </div>
          <ul className="site-footer__links" aria-label={footer.linksLabel}>
            <li>
              <a href={content.repo.url}>{footer.github}</a>
            </li>
            <li>
              <ReportErrorLink />
            </li>
            {content.nav.items.slice(1).map((item) => (
              <li key={item.href}>
                <a href={item.href}>{item.label}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
