---
name: auth.md
job: identity
order: 3
status: early
status_note: v0.6.0 (June 10, 2026); live at Neon, Cloudinary, monday.com, Firecrawl
tagline: agent sign-up
phrase: Your agent signs you up for a new service
analogy: A sign-up page written for robots.
looks_like: yourapp.com/auth.md
when_to_use: When you want agents to create accounts on your developer service without a sign-up form.
backers: WorkOS (open, MIT)
reality_check: Early use, and growing. The fully hands-free "vouched for" path needs the big agent makers to issue those passes, and none (Anthropic, OpenAI, Cursor) has announced it yet.
links:
  - label: Specification (GitHub)
    url: https://github.com/workos/auth.md
  - label: WorkOS overview
    url: https://workos.com/auth-md
  - label: Changelog
    url: https://github.com/workos/auth.md/blob/main/CHANGELOG.md
related:
  - id: poppy
    note: Poppy signs in existing customers. auth.md signs up new ones.
  - id: web-bot-auth
    note: Web Bot Auth proves which bot is asking. auth.md creates the account it acts for.
last_verified: "2026-10-11"
---

## How it works

When your agent needs a service you've never used, it hits a wall built to keep bots out: an email, a password, a CAPTCHA, a confirmation link. So it stops and asks you to make an account and paste back a key. auth.md replaces the wall with instructions at `yourapp.com/auth.md`.

Ask a coding agent to add web scraping to your app, and it calls the scraping service, gets "401: who are you?" plus a pointer to the service's login details and auth.md file, then signs you up one of three ways:

- **Vouched for:** the company running the agent signs a short-lived pass saying "this is a verified user" and registration finishes on its own.
- **By email:** you type a 6-digit code on the service's own page.
- **Anonymously:** the agent starts with limited access and you "claim" the account later.

Either way, it ends with a normal, short-lived, revocable OAuth token tied to you.

## Who's behind it

[WorkOS](https://workos.com/auth-md), an identity company, published it as an [open, MIT-licensed spec](https://github.com/workos/auth.md) on May 21, 2026 and shipped [six versions in three weeks](https://github.com/workos/auth.md/blob/main/CHANGELOG.md), reaching v0.6.0 on June 10. It isn't with any standards body; [WorkOS's own recap](https://workos.com/blog/agent-registration-with-auth-md) calls it "a spec, not an IETF-ratified standard." It's built from existing parts: OAuth's login-discovery files, and a vouching token ("ID-JAG") that is itself a draft in the IETF's OAuth working group.

WorkOS lists 15 adopters, and implementations vary a lot: [Neon](https://neon.com/auth.md) lets an agent spin up a temporary database the person claims within 72 hours; [Cloudinary](https://cloudinary.com/auth.md) does the same with a temporary media cloud claimable within 24 hours; [monday.com](https://monday.com/auth.md) has the agent solve a captcha and then creates the account; [Firecrawl](https://www.firecrawl.dev/auth.md) only accepts identities vouched for by WorkOS; Cloudflare and Resend said "not yet" at last check. Several follow the idea more than the exact spec.

## Neighbours

[MCP's latest spec (2026-07-28)](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization) recommends identifying the *app* with Client ID Metadata Documents, while auth.md adds *on whose behalf*. Poppy signs in *existing* customers; auth.md signs up *new* ones.
