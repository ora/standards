---
name: Poppy
full_name: Personal Agent Protocol (PAP)
job: identity
order: 2
status: early
status_note: Draft 0.2 (Oct 24, 2026), 0.3 in progress; a few small deployments
tagline: acts as you
phrase: Your agent signs in to a company as you
analogy: A valet key for your personal agent.
looks_like: /.well-known/poppy.json
when_to_use: When customers' own agents should sign in and act on their accounts. Track it; it's a fresh draft.
backers: Sierra + Meta; 7 launch and 35 design partners
reality_check: A draft first published October 9, 2026. A few small companies serve a `poppy.json`, including [Salespeak](https://salespeak.ai/agent-endpoint/), [Lorikeet](https://www.lorikeetcx.ai/blog/personal-agent-protocol), [Ticket Fairy](https://www.ticketfairy.com/.well-known/poppy.json) and [Alpic](https://alpic.ai/.well-known/poppy.json), most for signed-out chats or plain website browsing only. None of the launch partners does yet.
links:
  - label: Specification (Draft 0.2)
    url: https://personalagentprotocol.org/docs/0.2/spec
  - label: Draft 0.3 (in progress)
    url: https://personalagentprotocol.org/docs/spec
  - label: Path to 1.0 (open topics)
    url: https://personalagentprotocol.org/docs/path-to-1
  - label: Company implementation kit (skill and validator)
    url: https://personalagentprotocol.org/kit/company
  - label: Sierra's Draft 0.1 post
    url: https://sierra.ai/blog/poppy
  - label: Plain-language guide (poppy.ax)
    url: https://poppy.ax
related:
  - id: web-bot-auth
    note: Web Bot Auth proves which bot is calling. Poppy also says whom it acts for and what it may do.
  - id: auth-md
    note: Poppy signs in existing customers. auth.md signs up new ones.
  - id: ucp
    note: Poppy leaves shopping to UCP and ACP, and may overlap with UCP on sign-in.
  - id: ap2
    note: Payments are not covered yet. Until they are, payment consent needs another protocol, such as AP2.
last_verified: "2026-10-30"
spec_sources:
  - kind: page
    url: https://personalagentprotocol.org/docs/spec
    pin: "24d8da14fd16c944adeb9969221e6d6a6d9ba089f7299ce8c6a8df8a860001f3"
  - kind: page
    url: https://personalagentprotocol.org/docs/extensions/operations
    pin: "ec14d1af5ac4a65e0f691e49fbdf57ede32f32552d86ed88865e85bf8eedb169"
  - kind: page
    url: https://personalagentprotocol.org/docs/guides
    pin: "708fc192545d0a65b596c8dbee038338fe559f21f4d3c203023304a1168420d0"
---

## How it works

It lets the agent act for you at a company, with only the permissions you gave it, without opening the boot or the glovebox. Right now an AI agent acting for you has two bad options: pretend to be you in a browser, or not get in at all.

Poppy gives the company a file at `/.well-known/poppy.json` that says how agents can start a session, how you sign in, and which web pages, APIs and company agent are available. Sign-in uses OAuth, the familiar "Sign in with..." approval screen: you approve on the company's own page, on another device with a code, or (if the company allows it) the agent signs in for you. [Draft 0.3](https://personalagentprotocol.org/docs/guides) calls that last way temporary, with an end date to be set at version 1.0. An agent can also start signed out, as a guest.

Permissions are scopes. Version 0.2 has two shared ones, "read" and "write," and companies can add their own, such as "manage saved addresses." [Draft 0.3](https://personalagentprotocol.org/docs/changelog) drops the shared ones: each company names its own and says which make changes that can't be undone. For an action such as exchanging an item, the company can also [ask you to approve the exact terms](https://personalagentprotocol.org/docs/extensions/operations) before it acts. You also get a different anonymous ID at each company, so companies can't match you with each other. In the launch demo, Meta's Muse agent found Rocket Mortgage's agent and, with the user's permission, completed a mortgage pre-approval.

## Who's behind it

[Sierra](https://sierra.ai/blog) (led by Bret Taylor and Clay Bavor) and Meta announced it on October 6, 2026. [Sierra published Draft 0.1](https://sierra.ai/blog/poppy) on October 9 with seven launch partners (Genesys, Instinct, NiCE, Rocket, Shopify, Stripe and Walmart) and 35 more design partners, including OpenAI, Visa, Mastercard and PayPal. [Version 0.2](https://personalagentprotocol.org/docs/0.2/spec) followed on October 24, and [draft 0.3](https://personalagentprotocol.org/docs/changelog) is in progress.

The spec warns that any part can change, even in ways that break compatibility, and [lists payments as not yet covered](https://personalagentprotocol.org/docs/path-to-1). A reference implementation was promised within about a month of October 9 and isn't out yet. An implementation kit for companies was added on October 17: a skill that has a coding agent design and build a company's side, and a validator that acts as a test agent against a deployment. [The kit](https://personalagentprotocol.org/kit/company) now follows draft 0.3, not the published 0.2. Poppy reuses OAuth, OpenAPI and MCP rather than replacing them.
