import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SPEC_PINS_FILE, specPinsJson } from "@/lib/spec-pins";
import { getStandards } from "@/lib/standards";

const FILE = join(process.cwd(), SPEC_PINS_FILE);

describe(SPEC_PINS_FILE, () => {
  it("lists every standard's spec sources, as generated from content/standards", () => {
    const current = readFileSync(FILE, "utf8");
    const expected = specPinsJson(getStandards());
    // `npm run pins` sets UPDATE_PINS=1 to rewrite the file instead of failing.
    if (process.env.UPDATE_PINS === "1") {
      writeFileSync(FILE, expected);
      return;
    }
    expect(current, `${SPEC_PINS_FILE} is out of date. Run \`npm run pins\` and commit the result.`).toBe(expected);
  });

  it("never watches the same source twice for one standard", () => {
    for (const standard of getStandards()) {
      const keys = standard.spec_sources.map((source) => JSON.stringify({ ...source, pin: undefined }));
      expect(new Set(keys).size, `${standard.id} lists a spec source twice`).toBe(keys.length);
    }
  });
});
