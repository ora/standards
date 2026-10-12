import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readmeTable, withReadmeTable } from "@/lib/readme";
import { getStandards } from "@/lib/standards";

const README = join(process.cwd(), "README.md");

describe("README.md", () => {
  it("lists every standard, as generated from content/standards", () => {
    const current = readFileSync(README, "utf8");
    const expected = withReadmeTable(current, readmeTable(getStandards()));
    // `npm run readme` sets UPDATE_README=1 to rewrite the table instead of failing.
    if (process.env.UPDATE_README === "1") {
      writeFileSync(README, expected);
      return;
    }
    expect(current, "The standards table in README.md is out of date. Run `npm run readme` and commit the result.").toBe(
      expected,
    );
  });
});
