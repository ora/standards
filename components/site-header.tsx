import Link from "next/link";
import { content } from "@/lib/content";
import { MainNav } from "./main-nav";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="wrap site-header__bar">
        <Link href="/" className="wordmark" aria-label={content.homeLinkLabel}>
          <span className="wordmark__mark" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
          </span>
          <span aria-hidden="true">{content.siteName}</span>
        </Link>
        <MainNav />
      </div>
    </header>
  );
}
