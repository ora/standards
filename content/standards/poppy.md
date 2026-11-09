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
    pin: "b2ffb3afe546a2334d63052b0e97e3921e31117a"
  - kind: page
    url: https://personalagentprotocol.org/docs/spec
    pin: "2e6063f39dac6f2bf8eb541e2f28e7cc6c85345c2f726216285ab55738c1b185"
  - kind: page
    url: https://personalagentprotocol.org/docs/extensions/operations
    pin: "e5a42cb211e68ffff1cc4072456ce326fec4de2cc8b83cff37a63c522fbc2b57"
  - kind: page
    url: https://personalagentprotocol.org/docs/guides
    pin: "be0a953dd371f028369bb1a307e6614ecda1e67f02564c552c3a656b25782e75"
---

## How it works

It lets the agent act for you at a company, with only the permissions you gave it, without opening the boot or the glovebox. Right now an AI agent acting for you has two bad options: pretend to be you in a browser, or not get in at all.

Poppy gives the company a file at `/.well-known/poppy.json` that says which web pages, APIs and company agent are available. Since [Draft 0.3](https://personalagentprotocol.org/docs/0.3/spec), sign-in is plain OAuth, the familiar "Sign in with..." approval screen, found through the company's standard OAuth metadata: you approve on the company's own page, on another device with a code, or (if the company allows it) the agent signs in for you. The spec plans to retire that last way on a date set at version 1.0. Every request the agent sends carries a short signed pass naming the session, and an agent can also start signed out, as a guest.

Permissions are scopes. Draft 0.3 defines none of its own: each company names its own, such as "manage saved addresses," and says for each one whether it makes changes that can't be undone and whether it touches personal data. (Draft 0.2 had two shared ones, "read" and "write.") For an action such as exchanging an item, the company can also [ask you to approve the exact terms](https://personalagentprotocol.org/docs/extensions/operations) before it acts. You also get a different anonymous ID at each company, so companies can't match you with each other. In the launch demo, Meta's Muse agent found Rocket Mortgage's agent and, with the user's permission, completed a mortgage pre-approval.

## Who's behind it

[Sierra](https://sierra.ai/blog) (led by Bret Taylor and Clay Bavor) and Meta announced it on October 6, 2026. [Sierra published Draft 0.1](https://sierra.ai/blog/poppy) on October 9 with seven launch partners (Genesys, Instinct, NiCE, Rocket, Shopify, Stripe and Walmart) and 35 more design partners, including OpenAI, Visa, Mastercard and PayPal. [Version 0.2](https://personalagentprotocol.org/docs/0.2/spec) followed on October 24 and [version 0.3](https://personalagentprotocol.org/docs/0.3/spec), a redesign around plain OAuth, on November 4. [Draft 0.4](https://personalagentprotocol.org/docs/changelog) is in progress.

The spec warns that any part can change, even in ways that break compatibility, and [lists payments as not yet covered](https://personalagentprotocol.org/docs/roadmap#payments), apart from handing checkout to UCP. A reference implementation was promised within about a month of October 9 and isn't out yet. An implementation kit for companies was added on October 17: a skill that has a coding agent design and build a company's side, and a validator that acts as a test agent against a deployment. [The kit](https://personalagentprotocol.org/kit/company) now follows draft 0.4, ahead of the published 0.3. Poppy reuses OAuth, OpenAPI and MCP rather than replacing them.
