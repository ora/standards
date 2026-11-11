---
name: Poppy
full_name: Personal Agent Protocol (PAP)
job: identity
order: 2
status: early
status_note: Draft 0.3 (Nov 4, 2026), 0.4 in progress; a few small deployments
tagline: acts as you
phrase: Your agent signs in to a company as you
analogy: A valet key for your personal agent.
looks_like: /.well-known/poppy.json
when_to_use: When customers' own agents should sign in and act on their accounts. Track it; it's a fresh draft.
backers: Sierra + Meta; 7 launch and 35 design partners
reality_check: A draft first published October 9, 2026. A few small companies serve a `poppy.json`, including [Salespeak](https://salespeak.ai/agent-endpoint/), [Lorikeet](https://www.lorikeetcx.ai/blog/personal-agent-protocol), [Ticket Fairy](https://www.ticketfairy.com/.well-known/poppy.json) and [Alpic](https://alpic.ai/.well-known/poppy.json), most for signed-out chats or plain website browsing only. None of the launch partners does yet.
links:
  - label: Specification (Draft 0.3)
    url: https://personalagentprotocol.org/docs/0.3/spec
  - label: Draft 0.4 (in progress)
    url: https://personalagentprotocol.org/docs/spec
  - label: Roadmap to 1.0
    url: https://personalagentprotocol.org/docs/roadmap
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
    note: Poppy finds the company and signs you in; its UCP extension hands carts, checkout and payment to UCP.
  - id: ap2
    note: Payments are not covered yet. Until they are, payment consent needs another protocol, such as AP2.
last_verified: "2026-10-30"
spec_sources:
  - kind: git-path
    repo: personal-agent-protocol/personal-agent-protocol
    path: content/versions/0.3
    pin: "1e12f5a57bb3373ce90fdb41ad4d6bad8f960895"
  - kind: git-path
    repo: personal-agent-protocol/personal-agent-protocol
    path: content/versions/versions.json
    pin: "359b99e717a9fee2937216ce71af63eee0b3eceb"
  - kind: page
    url: https://personalagentprotocol.org/docs/spec
    pin: "654a1339d24bfc2ee1eb4082657fb7d68f322d6e52fc8c1f7c1d7ca22b73289c"
  - kind: page
    url: https://personalagentprotocol.org/docs/extensions/operations
    pin: "f8bf4eaebc1dabfb22b21fcf24d6d572f78caa669dae54d024cb8d1cce962c04"
  - kind: page
    url: https://personalagentprotocol.org/docs/guides
    pin: "9f7c5a9a77fece2fd3d9c2acb4fc0ec236117a0bacdfa4c724062a8839b1a89d"
  - kind: page
    url: https://personalagentprotocol.org/docs/extensions
    pin: "82ca57a473356ae3c0010acb42dff23f107612ac9cbb97b7ece36b50c3c82b03"
  - kind: page
    url: https://personalagentprotocol.org/docs/extensions/browser-control
    pin: "611e30c47fef811bef0d4fbf682218f16353962df010763e879134e7dc759bd0"
  - kind: page
    url: https://personalagentprotocol.org/docs/extensions/mediated-sign-in
    pin: "b4c3b5aafade726dad00ef4b48c8ab7854379b1ecc237879c878b537264b8e1e"
---

## How it works

It lets the agent act for you at a company, with only the permissions you gave it, without opening the boot or the glovebox. Right now an AI agent acting for you has two bad options: pretend to be you in a browser, or not get in at all.

Poppy gives the company a file at `/.well-known/poppy.json` that says which web pages, APIs and company agent are available. Since [Draft 0.3](https://personalagentprotocol.org/docs/0.3/spec), sign-in is plain OAuth, the familiar "Sign in with..." approval screen, found through the company's standard OAuth metadata: you approve on the company's own page, on another device with a code, or (if the company allows it) the agent signs in for you. The spec plans to retire that last way on a date set at version 1.0. Every request the agent sends carries a short signed pass naming the session, and an agent can also start signed out, as a guest.

Permissions are scopes. Draft 0.3 defines none of its own: each company names its own, such as "manage saved addresses," and says for each one whether it makes changes that can't be undone and whether it touches personal data. (Draft 0.2 had two shared ones, "read" and "write.") For an action such as exchanging an item, the company can also [ask you to approve the exact terms](https://personalagentprotocol.org/docs/extensions/operations) before it acts. You also get a different anonymous ID at each company, so companies can't match you with each other. In the launch demo, Meta's Muse agent found Rocket Mortgage's agent and, with the user's permission, completed a mortgage pre-approval.

## Who's behind it

[Sierra](https://sierra.ai/blog) (led by Bret Taylor and Clay Bavor) and Meta announced it on October 6, 2026. [Sierra published Draft 0.1](https://sierra.ai/blog/poppy) on October 9 with seven launch partners (Genesys, Instinct, NiCE, Rocket, Shopify, Stripe and Walmart) and 35 more design partners, including OpenAI, Visa, Mastercard and PayPal. [Version 0.2](https://personalagentprotocol.org/docs/0.2/spec) followed on October 24 and [version 0.3](https://personalagentprotocol.org/docs/0.3/spec), a redesign around plain OAuth, on November 4. [Draft 0.4](https://personalagentprotocol.org/docs/changelog) is in progress.

The spec warns that any part can change, even in ways that break compatibility, and [lists payments as not yet covered](https://personalagentprotocol.org/docs/roadmap#payments), apart from handing checkout to UCP. A reference implementation was promised within about a month of October 9 and isn't out yet. An implementation kit for companies was added on October 17: a skill that has a coding agent design and build a company's side, and a validator that acts as a test agent against a deployment. [The kit](https://personalagentprotocol.org/kit/company) now follows draft 0.4, ahead of the published 0.3. Poppy reuses OAuth, OpenAPI and MCP rather than replacing them.
