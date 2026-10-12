import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { guide, pairs } from "@/lib/content";
import { renderInline, renderMarkdown } from "@/lib/markdown";
import { JOB_IDS } from "@/lib/schema";
import {
  checkStandards,
  daysSince,
  getStandards,
  jobs,
  parseStandard,
  standardsForJob,
  STANDARDS_DIR,
} from "@/lib/standards";

const EM_DASH = String.fromCharCode(0x2014);
const ids = new Set(getStandards().map((s) => s.id));

const VALID = `---
name: Test
job: pay
order: 9
status: draft
status_note: Draft 0.1
tagline: test
phrase: A test
analogy: A test.
looks_like: /test
when_to_use: Never.
backers: Nobody
reality_check: None.
links:
  - label: Spec
    url: https://example.com/spec
last_verified: "2026-10-11"
---

Body.
`;

describe("content/standards", () => {
  it("loads every file and numbers them in map order", () => {
    const list = getStandards();
    const published = readdirSync(STANDARDS_DIR).filter((f) => f.endsWith(".md") && !f.startsWith("_"));
    expect(list.length).toBe(published.length);
    expect(list.map((s) => s.number)).toEqual(list.map((_, i) => i + 1));
    const jobOrder = list.map((s) => JOB_IDS.indexOf(s.job));
    expect(jobOrder).toEqual([...jobOrder].sort((a, b) => a - b));
  });

  it("gives every job at least one standard", () => {
    for (const job of jobs) expect(standardsForJob(job.id).length).toBeGreaterThan(0);
  });

  it("has a body with at least one section in every file", () => {
    for (const s of getStandards()) expect(s.body, s.id).toMatch(/^## /m);
  });

  it("contains no em dashes (house style)", () => {
    for (const file of readdirSync(STANDARDS_DIR)) {
      expect(readFileSync(join(STANDARDS_DIR, file), "utf8"), file).not.toContain(EM_DASH);
    }
  });

  it("keeps the template valid, so a copy of it passes the checks", () => {
    const template = readFileSync(join(STANDARDS_DIR, "_template.md"), "utf8");
    expect(parseStandard("example", template).name).toBe("Example");
  });

  it("accepts a valid file", () => {
    expect(parseStandard("test", VALID).name).toBe("Test");
  });

  it("names the file and the field when front matter is wrong", () => {
    expect(() => parseStandard("test", VALID.replace("status: draft", "status: shipped"))).toThrow(
      /content\/standards\/test\.md[\s\S]*status/,
    );
    expect(() => parseStandard("test", VALID.replace("url: https://example.com/spec", "url: not a url"))).toThrow(/url/);
    expect(() => parseStandard("test", VALID.replace("name: Test", "name: Test\nnickname: T"))).toThrow(/nickname/);
    expect(() => parseStandard("test", "no front matter")).toThrow(/front matter/);
    expect(() => parseStandard("Bad_Name", VALID)).toThrow(/lowercase/);
  });

  it("refuses links to standards that do not exist, and two standards in one slot", () => {
    const a = parseStandard("a", VALID.replace("last_verified", "related:\n  - id: nope\n    note: x\nlast_verified"));
    expect(() => checkStandards([a])).toThrow(/no content\/standards\/nope\.md/);
    const b = parseStandard("b", VALID);
    const c = parseStandard("c", VALID);
    expect(() => checkStandards([b, c])).toThrow(/both have job/);
  });
});

describe("content/*.json", () => {
  it("only names standards that exist", () => {
    for (const pair of pairs) for (const side of pair.sides) expect(ids, pair.id).toContain(side.id);
    for (const item of guide.items) for (const id of item.standards) expect(ids, item.situation).toContain(id);
  });

  it("contains no em dashes (house style)", () => {
    for (const file of readdirSync(join(process.cwd(), "content")).filter((f) => f.endsWith(".json"))) {
      expect(readFileSync(join(process.cwd(), "content", file), "utf8"), file).not.toContain(EM_DASH);
    }
  });
});

describe("markdown", () => {
  it("shows raw HTML as text and drops script links", () => {
    const html = renderMarkdown('<script>alert(1)</script>\n\n[x](javascript:alert(1)) [y](https://example.com "t")');
    expect(html).not.toContain("<script");
    expect(html).toContain('href="#"');
    expect(html).toContain('href="https://example.com" title="t" rel="noopener"');
  });

  it("renders inline text without a paragraph", () => {
    expect(renderInline("a `b` *c*")).toBe("a <code>b</code> <em>c</em>");
  });
});

describe("daysSince", () => {
  it("counts whole days", () => {
    expect(daysSince("2026-10-01", new Date("2026-10-11T12:00:00Z"))).toBe(10);
  });
});
