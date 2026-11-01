---
name: Web Bot Auth
job: identity
order: 1
status: production
status_note: WG draft -01 (Oct 29, 2026); live signers
tagline: which bot is it
phrase: Cryptographic ID for bots
analogy: A tamper-proof ID badge for bots, instead of a name tag anyone could write.
looks_like: Signed requests (RFC 9421)
when_to_use: When your bot visits other sites and must prove it's really yours, or you verify bots on yours.
backers: Cloudflare and Google authors, IETF working group
reality_check: In production. A draft, but a real one.
links:
  - label: IETF working-group draft
    url: https://datatracker.ietf.org/doc/draft-ietf-webbotauth-httpsig-protocol/
  - label: Cloudflare on agentic commerce
    url: https://blog.cloudflare.com/secure-agentic-commerce/
related:
  - id: poppy
    note: Web Bot Auth answers which agent is visiting. Poppy answers whom it represents.
  - id: auth-md
    note: auth.md signs up a new user for the agent; Web Bot Auth only proves which bot is asking.
  - id: x402
    note: Cloudflare plans to use them together for pay-per-crawl.
last_verified: "2026-10-30"
spec_sources:
  - kind: ietf-draft
    name: draft-ietf-webbotauth-httpsig-protocol
    pin: "01"
---

## How it works

Today websites identify bots by a label (the "user agent") that anyone can fake, or by IP address, which breaks easily. With Web Bot Auth, the company running the bot publishes its public keys at a web address, names that address in each request, and signs the request with the matching private key, using an existing IETF standard for signing web requests (RFC 9421).

The website, or its CDN such as Cloudflare, checks the signature and knows for certain "this really is OpenAI's agent" before deciding to let it in, block it or charge it. A site can also ask an unsigned bot to sign. A news site can let a verified shopping agent through while stopping an anonymous scraper wearing the same label.

It answers *which agent* is visiting, not *whom it represents*; that's Poppy's and OAuth's job.

## Who's behind it

Cloudflare proposed it in May 2025. On September 1, 2026 the IETF's webbotauth working group [adopted it as an official working-group draft](https://datatracker.ietf.org/doc/draft-ietf-webbotauth-httpsig-protocol/), written by authors from Cloudflare and Google; it's the group's only adopted document. It's still a draft, not an RFC: adoption isn't approval.

[Visa's Trusted Agent Protocol and Mastercard's Agent Pay build on it](https://blog.cloudflare.com/secure-agentic-commerce/), adding a tag that says whether the agent is browsing or buying. [OpenAI's ChatGPT agent](https://help.openai.com/en/articles/11845367), [Cloudflare's Browser Run](https://developers.cloudflare.com/browser-run/reference/automatic-request-headers/) and, as an experiment, [some Google-Agent traffic](https://developers.google.com/crawling/docs/crawlers-fetchers/web-bot-auth) sign requests today. [Revision -01](https://datatracker.ietf.org/doc/html/draft-ietf-webbotauth-httpsig-protocol-01) (October 29, 2026) changed how a request points to its keys: it now gives the exact address of its key set. [Cloudflare's own checker](https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/) still expects the older format (as of October 8, 2026), so early implementations will need updates.
