import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import { content } from "@/lib/content";
import { renderMarkdown } from "@/lib/markdown";
import "./contribute.css";

export const metadata: Metadata = {
  title: "Contribute",
  description: "Fix a sentence or add a standard with a pull request. How we decide each standard's status.",
  alternates: { canonical: "/contribute" },
};

export default function ContributePage() {
  const body = readFileSync(join(process.cwd(), "content", "contribute.md"), "utf8");
  return (
    <div className="wrap contribute">
      <header className="page-intro">
        <p className="kicker">Open source</p>
        <h1 className="page-title">Every page is a file. Make it better.</h1>
        <p className="lede">
          These standards change every month, and no one person can keep up. If you spot something wrong or
          missing, a pull request is the fastest way to fix it for everyone.
        </p>
        <p className="contribute__actions">
          <a href={content.repo.url} className="button button--primary">
            Open the repository ↗
          </a>
          <a href={`${content.repo.newIssueUrl}/choose`} className="button">
            Suggest a standard
          </a>
        </p>
      </header>
      <div className="prose contribute__body" dangerouslySetInnerHTML={{ __html: renderMarkdown(body) }} />
    </div>
  );
}
