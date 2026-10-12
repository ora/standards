---
name: Poppy
full_name: Personal Agent Protocol (PAP)
job: identity
order: 2
status: early
status_note: Draft 0.1 (Oct 9, 2026); one known public deployment
tagline: acts as you
phrase: Your agent signs in to a company as you
analogy: A valet key for your personal agent.
looks_like: /.well-known/poppy.json
when_to_use: When customers' own agents should sign in and act on their accounts. Track it; it's a fresh draft.
backers: Sierra + Meta; 6 launch and 35 design partners
reality_check: A draft first published October 9, 2026. Impressive partners, but only one company is publicly known to serve a working `poppy.json`, [Salespeak](https://salespeak.ai/.well-known/poppy.json), and none of the launch partners does yet.
links:
  - label: Specification (Draft 0.1)
    url: https://personalagentprotocol.org/docs/spec
  - label: Open topics
    url: https://personalagentprotocol.org/docs/open-topics
  - label: Sierra's blog
    url: https://sierra.ai/blog
  - label: Plain-language guide (poppy.ax)
    url: https://poppy.ax
related:
  - id: web-bot-auth
    note: Web Bot Auth proves the bot's identity. Poppy says whom it acts for.
  - id: auth-md
    note: Poppy signs in existing customers. auth.md signs up new ones.
  - id: ucp
    note: Poppy leaves shopping to UCP and ACP, and may overlap with UCP on sign-in.
  - id: ap2
    note: Payments are not covered yet. Payment consent is left to AP2.
last_verified: "2026-10-11"
---

## How it works

It lets the agent act for you at a company, with only the permissions you gave it, without opening the boot or the glovebox. Right now an AI agent acting for you has two bad options: pretend to be you in a browser, or not get in at all.

Poppy gives the company a file at `/.well-known/poppy.json` that says how agents can start a session, how you sign in, and which web pages, APIs and company agent are available. Sign-in uses OAuth, the familiar "Sign in with..." approval screen: you approve on the company's own page, on another device with a code, or (if the company allows it) the agent signs in for you.

Permissions are simple scopes like "read" and "write," plus custom ones such as "manage saved addresses." You also get a different anonymous ID at each company, so companies can't match you with each other. In the launch demo, Meta's Muse agent found Rocket Mortgage's agent and, with the user's permission, completed a mortgage pre-approval.

## Who's behind it

[Sierra](https://sierra.ai/blog) (led by Bret Taylor and Clay Bavor) and Meta announced it on October 6, 2026, with Genesys, Instinct, Rocket, Shopify, Stripe and Walmart as partners, then [published Draft 0.1](https://personalagentprotocol.org/docs/spec) on October 9 with 35 design partners (reported to include OpenAI, Visa, Mastercard and PayPal).

The spec warns that any part can change, even in ways that break compatibility, and [lists payments as not yet covered](https://personalagentprotocol.org/docs/open-topics). A reference implementation is promised within about a month. It reuses OAuth, OpenAPI and MCP rather than replacing them.
