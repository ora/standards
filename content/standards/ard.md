---
name: ARD
full_name: Agentic Resource Discovery
job: find
order: 1
status: early
status_note: 'v0.91 "Proposal" (Aug 26, 2026); small real use'
tagline: tool search
phrase: Search for agent tools across the web
analogy: A search engine for agent tools.
looks_like: /.well-known/ard.json
when_to_use: When you offer APIs, MCP servers or agents and want agent search registries to find them.
backers: Google-led authors (Google, Hugging Face, R.V. Guha)
reality_check: Early. [Hugging Face runs a public registry](https://huggingface.co/blog/agentic-resource-discovery-launch), and Hugging Face and GitHub now publish catalogs, though GitHub's is only at the older `ai-catalog.json` address. According to [an independent sweep in September 2026](https://github.com/Agent-Card/ai-catalog/issues/115), only 24 of 102 publishers could be found at `ard.json`; the other 78 used only `ai-catalog.json`.
links:
  - label: Specification (v0.91)
    url: https://agenticresourcediscovery.org/spec/
  - label: Google's announcement
    url: https://developers.googleblog.com/announcing-the-agentic-resource-discovery-specification/
  - label: Hugging Face registry launch
    url: https://huggingface.co/blog/agentic-resource-discovery-launch
related:
  - id: ai-catalog
    note: Its predecessor, now the publishing format. ARD is the discovery format. Serve the same file at both addresses.
last_verified: "2026-10-19"
spec_sources:
  - kind: git-path
    repo: ards-project/ard-spec
    path: spec
    pin: "40151d4a76af2e266723f78d9142f54a89fb5dcf"
---

## How it works

Today an AI assistant can only use the tools someone wired into it beforehand, like a phone that only runs its pre-installed apps. ARD flips that. A website publishes a small file at `/.well-known/ard.json` (".well-known" is just the web's agreed folder for files like this, the same idea as robots.txt) listing what it offers: an MCP server, an agent other agents can talk to, an API, a skill.

Separate "registries" collect these files and answer plain-language searches. Say your travel agent needs a live-weather tool it has never heard of: it asks a registry, gets a ranked list, checks who published each tool, and connects. A high ranking doesn't mean a tool is trustworthy; the spec keeps relevance and trust separate. Entries can include sample questions a real user would ask, which makes search work better.

## Who's behind it

[Google announced ARD](https://developers.googleblog.com/announcing-the-agentic-resource-discovery-specification/) on June 17, 2026. The [current version is v0.91](https://agenticresourcediscovery.org/spec/), a "Proposal" dated August 26, 2026, from authors at Google and Hugging Face plus R.V. Guha (who helped create RSS and Schema.org).

It tells agents to look for `ard.json` first and treats the older `ai-catalog.json` address as its predecessor. At a meeting on July 9, 2026 the two groups agreed to keep them [loosely linked, at least for now](https://github.com/ards-project/ard-spec/blob/main/adr/0010-ard-and-ai-catalog-loose-coupling.md): ai-catalog is the *publishing* format and ARD is the *discovery* format. The ARD project recorded this as a formal decision on October 11, 2026. The file name changed within a few months, so early tutorials already show the old address.
