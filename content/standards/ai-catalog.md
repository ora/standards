---
name: ai-catalog
full_name: AI Catalog
job: find
order: 2
status: early
status_note: Draft; MCP Server Cards (final) point to it; small real use
tagline: site's AI list
phrase: A site's list of its AI offerings
analogy: Your site's table of contents for AI.
looks_like: /.well-known/ai-catalog.json
when_to_use: When you publish that same list for MCP Server Cards and older tools. Serve one file at both addresses.
backers: Linux Foundation working group (MCP and A2A communities)
reality_check: Early, with live catalogs at GitHub, Buildkite, Hugging Face and Cloudflare's developer docs. [The working group's own list](https://github.com/Agent-Card/awesome-ai-catalogs) has 26, mostly small sites. ARD tools look for `ard.json` first and may skip the old address, so serve the same file at both `ai-catalog.json` and `ard.json`.
links:
  - label: ai-catalog.io
    url: https://ai-catalog.io/
  - label: Working repository
    url: https://github.com/Agent-Card/ai-catalog
  - label: MCP Server Cards (final)
    url: https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2127
related:
  - id: ard
    note: ARD calls ai-catalog its predecessor. ai-catalog sees itself as the lightweight publishing format; it was split off, not retired.
  - id: nlweb
    note: A catalog can list an NLWeb endpoint.
last_verified: "2026-10-30"
spec_sources:
  - kind: git-path
    repo: Agent-Card/ai-catalog
    path: specification
    pin: "7ee97d9655a13e1f6442ab505982c03db17134ea"
---

## How it works

Like a table of contents, it doesn't contain the chapters; it tells you where each one is. MCP servers, AI agents, plugins and datasets each invented their own way to be found, so an assistant would have to know a dozen conventions. AI Catalog replaces that with one JSON list at `/.well-known/ai-catalog.json`, where each entry says what kind of thing it is and either links to its full description or includes it.

A restaurant that works with a booking provider and a jobs provider can list both AI tools, so any assistant that only knows the restaurant's web address can find the booking tool. Catalogs can also point to other catalogs, so a big platform can list many sub-catalogs.

An entry can also carry optional Trust Manifests: claims about the tool, such as who published it or which audits it passed, each of which can be signed. Since October 6, 2026, the [spec](https://ai-catalog.io/spec/) lets several parties, say the publisher and an auditor, each add their own.

## Who's behind it

It's developed in a [Linux Foundation working repository](https://github.com/Agent-Card/ai-catalog) (started October 2025) with members from the MCP and A2A communities, and published at [ai-catalog.io](https://ai-catalog.io/). Even the group's name is inconsistent: ai-catalog.io calls it the "Agent Card Working Group," while Google thanks the "AI Catalog Working Group."

Its biggest recent boost: [MCP's "Server Cards" proposal](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2127) points discovery at `ai-catalog.json`; it was [marked final](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/main/seps/2127-mcp-server-cards.md) on October 6, 2026. ARD calls ai-catalog its predecessor, but ai-catalog sees itself as a lightweight publishing format that stays separate, loosely linked to ARD for now: it was split off, not retired.
