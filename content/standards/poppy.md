---
name: Poppy
full_name: Personal Agent Protocol (PAP)
job: identity
order: 2
status: early
status_note: Version 1.0 (Nov 14, 2026), frozen; a few deployments, mostly signed out only
tagline: acts as you
phrase: Your agent signs in to a company as you
analogy: A valet key for your personal agent.
looks_like: /.well-known/poppy.json
when_to_use: When customers' own agents should sign in and act on their accounts. Track it; version 1.0 is days old.
backers: Sierra + Meta; 7 launch and 35 design partners
reality_check: First published as a draft on October 9, 2026, and published as version 1.0 on November 14. A few companies serve a `poppy.json`, almost all for signed-out chats or plain website browsing only, and most still on drafts 0.1 to 0.3. Small ones include [Salespeak](https://salespeak.ai/agent-endpoint/), [Lorikeet](https://www.lorikeetcx.ai/blog/personal-agent-protocol), [Ticket Fairy](https://www.ticketfairy.com/.well-known/poppy.json) and [Alpic](https://alpic.ai/.well-known/poppy.json). The first launch partner is now live. [Rocket Mortgage](https://www.rocketmortgage.com/.well-known/poppy.json) serves a Draft 0.3 file with a signed-out MCP server for mortgage education and sample rates, and no sign-in yet. No other launch partner does.
links:
  - label: Specification (version 1.0)
    url: https://personalagentprotocol.org/docs/1.0/spec
  - label: What changed in 1.0
    url: https://personalagentprotocol.org/docs/changelog#v1-0
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
last_verified: "2026-11-15"
spec_sources:
  - kind: git-path
    repo: personal-agent-protocol/personal-agent-protocol
    path: content/versions/1.0
    pin: "0e6d0d657d4744c8afdcb6b3bab6b841e383e8d3"
  - kind: git-path
    repo: personal-agent-protocol/personal-agent-protocol
    path: content/versions/versions.json
    pin: "c36e148cac84a2965f55a5e8f80ca18b50954041"
  - kind: page
    url: https://personalagentprotocol.org/docs/spec
    pin: "6754d65546ad3ed554b5e685660433681a34d3638a574f9dc92ae2615edbd5b0"
  - kind: page
    url: https://personalagentprotocol.org/docs/extensions/operations
    pin: "3ff24dccc84e121b638ab6f448bd9fd56188350c9723bbccac6bd2d15e5b846c"
  - kind: page
    url: https://personalagentprotocol.org/docs/guides
    pin: "df26222dcc653162d262f9d3073fd82c13f986a8b13919ec2d6ace2e54d9745a"
  - kind: page
    url: https://personalagentprotocol.org/docs/extensions
    pin: "82ca57a473356ae3c0010acb42dff23f107612ac9cbb97b7ece36b50c3c82b03"
  - kind: page
    url: https://personalagentprotocol.org/docs/extensions/browser-control
    pin: "611e30c47fef811bef0d4fbf682218f16353962df010763e879134e7dc759bd0"
  - kind: page
    url: https://personalagentprotocol.org/docs/extensions/mediated-sign-in
    pin: "d7397f4a3716d827035b82576f30fcf3ca9e5ab2dbf0353bcbf3744cfeabf93a"
---

## How it works

It lets the agent act for you at a company, with only the permissions you gave it, without opening the boot or the glovebox. Right now an AI agent acting for you has two bad options: pretend to be you in a browser, or not get in at all.

Poppy gives the company a file at `/.well-known/poppy.json` that says which web pages, APIs and company agent are available. Since [Draft 0.3](https://personalagentprotocol.org/docs/0.3/spec), sign-in is plain OAuth, found through the company's standard OAuth metadata: you approve on the company's own page, on another device with a code, or (if the company allows it) the agent signs in for you. [Version 0.4](https://personalagentprotocol.org/docs/0.4/spec) makes the first of those the preferred way, and the spec plans to retire the last one on March 17, 2027. Every request the agent sends carries a short signed pass naming the session, and an agent can also start signed out, as a guest.

Permissions are scopes. Each company names its own, such as "manage saved addresses," and says for each one whether it makes changes that can't be undone and whether it touches personal data. The protocol defines just one, which lets the agent's browser use the website signed in as you. (Draft 0.2 had two shared ones, "read" and "write.") For an action such as exchanging an item, the company can also [ask for approval of the exact terms](https://personalagentprotocol.org/docs/0.4/extensions/operations) before it acts, given by you or by your agent on an instruction you gave it. A company can also serve several versions of the protocol at once, so agents can move to a new one at their own pace. You also get a different anonymous ID at each company, so companies can't match you with each other. In the launch demo, Meta's Muse agent found Rocket Mortgage's agent and, with the user's permission, completed a mortgage pre-approval.

## Who's behind it

[Sierra](https://sierra.ai/blog) (led by Bret Taylor and Clay Bavor) and Meta announced it on October 6, 2026. [Sierra published Draft 0.1](https://sierra.ai/blog/poppy) on October 9 with seven launch partners (Genesys, Instinct, NiCE, Rocket, Shopify, Stripe and Walmart) and 35 more design partners, including OpenAI, Visa, Mastercard and PayPal. [Version 0.2](https://personalagentprotocol.org/docs/0.2/spec) followed on October 24, [version 0.3](https://personalagentprotocol.org/docs/0.3/spec), a redesign around plain OAuth, on November 4, and [version 0.4](https://personalagentprotocol.org/docs/0.4/spec) on November 10 as the 1.0 release candidate. [Version 1.0](https://personalagentprotocol.org/docs/1.0/spec) was published and frozen on November 14. The authors call it 0.4 with the fixes implementers needed, and [some of those fixes](https://personalagentprotocol.org/docs/changelog#v1-0) break compatibility with 0.4. Most tighten sign-in: the company's approval page must list every permission it will grant, including ones the person approved before; a company may require the agent to send its sign-in request ahead, server to server (Pushed Authorization Requests); the short signed proof the agent sends when it asks for a token now lasts at most five minutes; and one sign-in covers all of a company's services, with the agent then asking for each service's token in its own request. An agent that gets a sign-in error it doesn't recognize signs in again. A company's own agent must say in `poppy.json` what it can help with, and its "working" status now means only that it is still replying. From 1.0, each side sends only what the other side's version defines.

Later 1.x versions are meant to add features without breaking 1.0, and only for agents that declare the newer version. The spec still [lists payments as not yet covered](https://personalagentprotocol.org/docs/roadmap#payments), apart from handing checkout to UCP. A reference implementation was promised within about a month of October 9 and isn't out yet. An implementation kit for companies was added on October 17: a skill that has a coding agent design and build a company's side, and a validator that acts as a test agent against a deployment. [The kit](https://personalagentprotocol.org/kit/company) follows version 1.0. [The guides](https://personalagentprotocol.org/docs/guides) now advise a company that offers sign-in and allows browsing to let the agent's browser join the signed-in session, so the person isn't signed out when the agent opens the website. Poppy reuses OAuth, OpenAPI and MCP rather than replacing them.
