---
name: Poppy
full_name: Personal Agent Protocol (PAP)
job: identity
order: 2
status: early
status_note: Draft 0.1 (Oct 9, 2026), 0.2 in progress; a few small deployments
tagline: acts as you
phrase: Your agent signs in to a company as you
analogy: A valet key for your personal agent.
looks_like: /.well-known/poppy.json
when_to_use: When customers' own agents should sign in and act on their accounts. Track it; it's a fresh draft.
backers: Sierra + Meta; 7 launch and 35 design partners
reality_check: A draft first published October 9, 2026. A few small companies serve a `poppy.json`, including [Salespeak](https://salespeak.ai/agent-endpoint/), [Lorikeet](https://www.lorikeetcx.ai/blog/personal-agent-protocol), [Ticket Fairy](https://www.ticketfairy.com/.well-known/poppy.json) and [Alpic](https://alpic.ai/.well-known/poppy.json), most for signed-out chats or plain website browsing only. None of the launch partners does yet.
links:
  - label: Specification (Draft 0.1)
    url: https://personalagentprotocol.org/docs/0.1/spec
  - label: Draft 0.2 (in progress)
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
  - id: pact
    note: PACT, from Decagon, also lets an agent act for a customer, as a layer on A2A rather than its own protocol.
  - id: ap2
    note: Payments are not covered yet. Until they are, payment consent needs another protocol, such as AP2.
last_verified: "2026-10-19"
spec_sources:
  - kind: page
    url: https://personalagentprotocol.org/docs/spec
    pin: "3b7a81416cfc5f98d4ce1d6f2cb0e359cbf68a46d5a5317b5a4a856855eb50e3"
  - kind: page
    url: https://personalagentprotocol.org/docs/extensions/operations
    pin: "6f94925f7306c2d19cb5548e9655c8d414709301ba8ef37c6e1a436969614b7f"
  - kind: page
    url: https://personalagentprotocol.org/docs/guides
    pin: "f2b0a17c0f420732a721f2843717015cb3f8277fc365a6b829af5e36bd67ea49"
---

## How it works

It lets the agent act for you at a company, with only the permissions you gave it, without opening the boot or the glovebox. Right now an AI agent acting for you has two bad options: pretend to be you in a browser, or not get in at all.

Poppy gives the company a file at `/.well-known/poppy.json` that says how agents can start a session, how you sign in, and which web pages, APIs and company agent are available. Sign-in uses OAuth, the familiar "Sign in with..." approval screen: you approve on the company's own page, on another device with a code, or (if the company allows it) the agent signs in for you. An agent can also start signed out, as a guest.

Permissions are simple scopes like "read" and "write," plus custom ones such as "manage saved addresses." You also get a different anonymous ID at each company, so companies can't match you with each other. In the launch demo, Meta's Muse agent found Rocket Mortgage's agent and, with the user's permission, completed a mortgage pre-approval.

## Who's behind it

[Sierra](https://sierra.ai/blog) (led by Bret Taylor and Clay Bavor) and Meta announced it on October 6, 2026. [Sierra published Draft 0.1](https://sierra.ai/blog/poppy) on October 9 with seven launch partners (Genesys, Instinct, NiCE, Rocket, Shopify, Stripe and Walmart) and 35 more design partners, including OpenAI, Visa, Mastercard and PayPal. [Draft 0.2](https://personalagentprotocol.org/docs/changelog) is in progress, with no publication date yet.

The spec warns that any part can change, even in ways that break compatibility, and [lists payments as not yet covered](https://personalagentprotocol.org/docs/path-to-1). A reference implementation was promised within about a month of October 9 and isn't out yet. An implementation kit for companies was added on October 17: a skill that has a coding agent design and build a company's side, and a validator that acts as a test agent against a deployment. It reuses OAuth, OpenAPI and MCP rather than replacing them.
