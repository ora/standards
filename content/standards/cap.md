---
name: CAP
full_name: Concierge Agent Protocol
job: act
order: 3
status: draft
status_note: 1.0 Draft (Nov 8, 2026); six listed sites, all served by the author's company
tagline: ask a company's agent
phrase: An agent asks a company's own agent and gets its answer
analogy: A front-desk number for agents. They ask the company's concierge instead of searching the building themselves.
looks_like: /agent.txt and POST /cap/v1/messages
when_to_use: When your company already runs a support or sales agent and you want other people's agents to ask it directly. Track it; it's a fresh draft from one vendor.
backers: Tony Spiro (Cosmic); no standards body
reality_check: Draft, first published October 16, 2026. On November 11, 2026, [the protocol's own directory](https://conciergeprotocol.org/directory) listed six sites that pass its check, and all six are served by Cosmic, the author's company. Five are Cosmic's own sites and one is a customer's. No AI assistant is publicly known to look for `agent.txt` on its own yet.
links:
  - label: Specification (1.0 Draft)
    url: https://conciergeprotocol.org/spec
  - label: Repository (spec, reference server, checker)
    url: https://github.com/conciergeprotocol/cap
  - label: Caller card
    url: https://conciergeprotocol.org/cap.txt
  - label: Directory of sites that pass the check
    url: https://conciergeprotocol.org/directory
  - label: Benchmark (by the authors)
    url: https://conciergeprotocol.org/benchmark
related:
  - id: nlweb
    note: Both let an agent ask a site in plain language. NLWeb answers from the site's structured content; CAP hands the question to the company's own agent, which can also answer for a signed-in customer.
  - id: webmcp
    note: WebMCP hands tools to the agent inside the browser page. CAP is an endpoint on your server and never shows the agent your tools.
  - id: poppy
    note: Both let a person's agent reach a company. Poppy covers sessions, sign-in, APIs and the web; CAP is only a question-and-answer door, with an optional OAuth sign-in.
  - id: ai-catalog
    note: A site can list its agent.txt as an entry in its AI catalog (or ARD file).
last_verified: "2026-11-11"
spec_sources:
  - kind: git-path
    repo: conciergeprotocol/cap
    path: spec.md
    pin: "66495014ef731b8d5e81102e2d73e5e88d8923d0"
---

## How it works

A company publishes a short text file at `/agent.txt`, next to `robots.txt`. Its first line is `Protocol: CAP/1.0`, and a `CAP` line gives a base URL. A visiting agent posts a question to `{CAP}/messages` as JSON, with a `CAP-From` header naming itself, and gets back one message: `working`, `done` with a text `reply`, or `failed`. A slow answer comes back as `202` with a URL to check later, and a follow-up points to the previous message. An agent that can only open URLs can ask a public question with a plain GET.

The company's agent answers with its own tools, prompts and keys, and the reply never names them. On a clothing store, a visiting agent asks "Do you have the linen shirt in medium, under $80?" and gets one answer with links, instead of filtering listing pages and opening each product. For a question about someone's account, such as "where is my order?", the person signs in on the company's own page with a code the agent shows them (OAuth device sign-in, RFC 8628), and the token works only for that agent. An action that is hard to undo, such as a cancellation, waits until the person approves it on a link.

The spec also asks sites to point to the file from their homepage (`<link rel="agent">`) and from `llms.txt`, for agents that read pages rather than look for the file.

## Who's behind it

Tony Spiro, founder of the headless CMS company [Cosmic](https://www.cosmicjs.com), wrote it and is the only author in [the repository](https://github.com/conciergeprotocol/cap). The first public draft, 1.0 Draft, is dated October 16, 2026, and [the changelog](https://github.com/conciergeprotocol/cap/blob/main/CHANGELOG.md) lists additions through November 8. The spec is under CC BY 4.0 and the reference server under Apache 2.0. There is no standards body; [the governance page](https://github.com/conciergeprotocol/cap/blob/main/GOVERNANCE.md) says 1.0 becomes final only when several independent owners serve it in production. Cosmic serves CAP for sites built on it.

[The authors' benchmark](https://conciergeprotocol.org/benchmark) (October 22, 2026) ran one test store and found that an agent got the same answers asking through CAP as reading the site, at about a fifth of the cost. Nobody else has published a test.

## Neighbours

NLWeb is the closest: both are "ask the site." NLWeb searches the site's own structured data; CAP passes the question to whatever agent the company already runs, and adds questions about a customer's account. [The spec maps a CAP message onto an A2A task](https://conciergeprotocol.org/spec#relationship-to-other-protocols), so a company can serve both from the same agent.
