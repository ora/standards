import { SPEC_IDS, SPECS } from "@ora-ai/specs";
import { sourceKey } from "@ora-ai/specs/kinds";
import { describe, expect, it } from "vitest";
import { publicSpecs, specsDocument } from "@/lib/specs";
import { getStandards } from "@/lib/standards";

const SITE = "https://ax.guide";
const mcpDirs = sourceKey(SPECS.mcp.sources[0]);

function status(standards: Record<string, unknown>) {
  return { checked_at: "2026-11-12T05:23:00.000Z", standards } as Parameters<typeof publicSpecs>[0];
}

describe("content/standards spec ids", () => {
  it("points every standard at a spec in the registry, one standard per spec", () => {
    const used = getStandards().map((s) => s.spec);
    for (const id of used) expect(SPEC_IDS).toContain(id);
    expect(new Set(used).size).toBe(used.length);
  });
});

describe("publicSpecs", () => {
  it("lists every registry spec, with no upstream state when the status can't be read", () => {
    const specs = publicSpecs(null, SITE);
    expect(specs.map((s) => s.id)).toEqual([...SPEC_IDS]);
    for (const s of specs) expect(s.latest.state).toBe("unknown");
    expect(specs.find((s) => s.id === "mcp")?.reviewed).toMatchObject({
      version: SPECS.mcp.reviewed.version,
      url: `https://modelcontextprotocol.io/specification/${SPECS.mcp.reviewed.version}`,
    });
    expect(specs.find((s) => s.id === "robots-txt")?.reviewed).toBeNull();
    expect(specs.find((s) => s.id === "pap")?.standard).toBe(`${SITE}/standards/poppy`);
    expect(specs.find((s) => s.id === "openapi")?.standard).toBeNull();
  });

  it("names a newer revision and links what changed, from shape-checked live values only", () => {
    const specs = publicSpecs(
      status({
        mcp: { changed: true, since: "2026-11-10", issue: "https://github.com/ora/specs/issues/7", sources: { [mcpDirs]: { kind: "git-dated-dirs", live: "2026-12-01" } } },
        ucp: { changed: true, issue: "https://github.com/evil/repo/issues/1", sources: { [sourceKey(SPECS.ucp.sources[0])]: { kind: "git-latest-tag", live: "v1 <img src=x>" } } },
        acp: { changed: false },
      }),
      SITE,
    );
    const mcp = specs.find((s) => s.id === "mcp")!;
    expect(mcp.latest).toEqual({
      state: "changed",
      revision: { label: "2026-12-01", url: "https://modelcontextprotocol.io/specification/2026-12-01" },
      changes: "https://modelcontextprotocol.io/specification/2026-12-01",
      since: "2026-11-10",
      issue: "https://github.com/ora/specs/issues/7",
    });
    const ucp = specs.find((s) => s.id === "ucp")!;
    expect(ucp.latest).toMatchObject({ state: "changed", revision: null, changes: null, issue: null });
    expect(specs.find((s) => s.id === "acp")?.latest.state).toBe("same");
  });

  it("publishes versions, reviewed state and upstream state, never which release a product runs", () => {
    const text = JSON.stringify(specsDocument(null, SITE));
    expect(text).not.toMatch(/adoption|consumer|lockfile/i);
    expect(JSON.parse(text).registry).toMatchObject({ package: "@ora-ai/specs", url: "https://github.com/ora/specs" });
  });
});
