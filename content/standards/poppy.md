---
name: Poppy
full_name: Personal Agent Protocol (PAP)
job: identity
order: 2
status: early
status_note: Version 0.4 (Nov 10, 2026), the 1.0 release candidate; a few small deployments
tagline: acts as you
phrase: Your agent signs in to a company as you
analogy: A valet key for your personal agent.
looks_like: /.well-known/poppy.json
when_to_use: When customers' own agents should sign in and act on their accounts. Track it; it's a fresh draft.
backers: Sierra + Meta; 7 launch and 35 design partners
reality_check: A draft first published October 9, 2026, now at its 1.0 release candidate. A few small companies serve a `poppy.json`, including [Salespeak](https://salespeak.ai/agent-endpoint/), [Lorikeet](https://www.lorikeetcx.ai/blog/personal-agent-protocol), [Ticket Fairy](https://www.ticketfairy.com/.well-known/poppy.json) and [Alpic](https://alpic.ai/.well-known/poppy.json), most for signed-out chats or plain website browsing only, and most still on drafts 0.1 or 0.2. None of the launch partners does yet.
links:
  - label: Specification (version 0.4, the 1.0 release candidate)
    url: https://personalagentprotocol.org/docs/0.4/spec
  - label: Draft 1.0 (in progress)
    url: https://personalagentprotocol.org/docs/1.0/spec
  - label: Path to 1.0
    url: https://personalagentprotocol.org/docs/path-to-1
  - label: Roadmap
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
last_verified: "2026-11-12"
spec_sources:
  - kind: git-path
    repo: personal-agent-protocol/personal-agent-protocol
    path: content/versions/1.0
    pin: "720a0fe76f4b826d2008679395c26779319bf965"
  - kind: git-path
    repo: personal-agent-protocol/personal-agent-protocol
    path: content/versions/versions.json
    pin: "ff7c9a373e46e3f23957eae598cf1bf172e1b769"
  - kind: page
    url: https://personalagentprotocol.org/docs/spec
    pin: "a92048d4ae0789a65af128f3a2d6295299c6cf0161a737d1064f8b51738d3383"
  - kind: page
    url: https://personalagentprotocol.org/docs/extensions/operations
    pin: "3ff24dccc84e121b638ab6f448bd9fd56188350c9723bbccac6bd2d15e5b846c"
  - kind: page
    url: https://personalagentprotocol.org/docs/guides
    pin: "e2615c6deac2213b60fbec6da918169a57c77677b71adca712e045a814b4e832"
  - kind: page
    url: https://personalagentprotocol.org/docs/extensions
    pin: "82ca57a473356ae3c0010acb42dff23f107612ac9cbb97b7ece36b50c3c82b03"
  - kind: page
    url: https://personalagentprotocol.org/docs/extensions/browser-control
    pin: "611e30c47fef811bef0d4fbf682218f16353962df010763e879134e7dc759bd0"
  - kind: page
    url: https://personalagentprotocol.org/docs/extensions/mediated-sign-in
    pin: "038750a9437204cb4142ea17a2fdffdece2f4ca5b64a89dd530ad4d656f52b13"
---

## How it works

It lets the agent act for you at a company, with only the permissions you gave it, without opening the boot or the glovebox. Right now an AI agent acting for you has two bad options: pretend to be you in a browser, or not get in at all.

Poppy gives the company a file at `/.well-known/poppy.json` that says which web pages, APIs and company agent are available. Since [Draft 0.3](https://personalagentprotocol.org/docs/0.3/spec), sign-in is plain OAuth, found through the company's standard OAuth metadata: you approve on the company's own page, on another device with a code, or (if the company allows it) the agent signs in for you. [Version 0.4](https://personalagentprotocol.org/docs/0.4/spec) makes the first of those the preferred way, and the spec plans to retire the last one on a date set at version 1.0. Every request the agent sends carries a short signed pass naming the session, and an agent can also start signed out, as a guest.

Permissions are scopes. Each company names its own, such as "manage saved addresses," and says for each one whether it makes changes that can't be undone and whether it touches personal data. The protocol defines just one, which lets the agent's browser use the website signed in as you. (Draft 0.2 had two shared ones, "read" and "write.") For an action such as exchanging an item, the company can also [ask for approval of the exact terms](https://personalagentprotocol.org/docs/0.4/extensions/operations) before it acts, given by you or by your agent on an instruction you gave it. A company can also serve several versions of the protocol at once, so agents can move to a new one at their own pace. You also get a different anonymous ID at each company, so companies can't match you with each other. In the launch demo, Meta's Muse agent found Rocket Mortgage's agent and, with the user's permission, completed a mortgage pre-approval.

## Who's behind it

[Sierra](https://sierra.ai/blog) (led by Bret Taylor and Clay Bavor) and Meta announced it on October 6, 2026. [Sierra published Draft 0.1](https://sierra.ai/blog/poppy) on October 9 with seven launch partners (Genesys, Instinct, NiCE, Rocket, Shopify, Stripe and Walmart) and 35 more design partners, including OpenAI, Visa, Mastercard and PayPal. [Version 0.2](https://personalagentprotocol.org/docs/0.2/spec) followed on October 24, [version 0.3](https://personalagentprotocol.org/docs/0.3/spec), a redesign around plain OAuth, on November 4, and [version 0.4](https://personalagentprotocol.org/docs/0.4/spec) on November 10 as the 1.0 release candidate. [Draft 1.0](https://personalagentprotocol.org/docs/changelog) is in progress: the authors say it takes only fixes for problems implementers find, no new features, and that a fix can still break compatibility.

Until 1.0 the spec can still change in ways that break compatibility, and it [lists payments as not yet covered](https://personalagentprotocol.org/docs/roadmap#payments), apart from handing checkout to UCP. A reference implementation was promised within about a month of October 9 and isn't out yet. An implementation kit for companies was added on October 17: a skill that has a coding agent design and build a company's side, and a validator that acts as a test agent against a deployment. [The kit](https://personalagentprotocol.org/kit/company) now follows draft 1.0, ahead of the published 0.4. Poppy reuses OAuth, OpenAPI and MCP rather than replacing them.
