---
name: PACT
full_name: Personal Agent Consent & Trust Protocol
job: identity
order: 4
status: draft
status_note: Unversioned spec (Oct 6, 2026); no known deployments
tagline: acts as you, over A2A
phrase: Your agent talks to a company's support agent for you
analogy: A signed letter of introduction to a company's help desk, with an optional permission slip.
looks_like: /.well-known/agent-card.json
when_to_use: When personal agents should reach your support agent over A2A. Track it; it's a fresh draft from one vendor.
backers: Decagon, co-developed with Instinct
reality_check: A draft open-sourced on October 6, 2026, the same day Poppy was announced. No business or personal agent is publicly known to use it yet. Decagon's [Personal Agent Gateway](https://decagon.ai/blog/personal-agents-are-here), introduced on October 1, helps its customers spot and route personal agents, but no customer is named as using PACT through it.
links:
  - label: Specification
    url: https://openpactprotocol.org/spec
  - label: Repository (spec, packages, reference Provider)
    url: https://github.com/openpactprotocol/openpactprotocol
  - label: Decagon's announcement
    url: https://decagon.ai/blog/introducing-the-personal-agent-consent-trust-protocol-pact
  - label: A2A, the protocol it builds on
    url: https://a2a-protocol.org
related:
  - id: poppy
    note: Both let a personal agent act for a customer. Poppy is its own protocol from Sierra and Meta; PACT is a layer on A2A from Decagon, which has joined Poppy's working group.
  - id: web-bot-auth
    note: Both have the agent sign with its own published keys. Web Bot Auth signs web requests; PACT signs a token sent with each A2A message.
  - id: auth-md
    note: PACT acts for existing customers. auth.md signs up new ones.
last_verified: "2026-10-21"
spec_sources:
  - kind: git-path
    repo: openpactprotocol/openpactprotocol
    path: docs/spec.md
    pin: "294e4bd6af29fbd64fcec64200d52ac449b8e659"
---

## How it works

PACT lets a person's agent message a company's support agent, prove which agent it is and, if the company offers it, act on the person's account with only the permissions they approved. It builds on the Agent2Agent protocol (A2A) and OAuth, and everything A2A defines works unchanged.

The company publishes an A2A "Agent Card" at `/.well-known/agent-card.json` on its own domain, usually pointing to the support vendor that hosts its agent (the spec calls this a Provider). The personal agent registers once with each Provider, giving it the address of its public keys, then signs a short-lived token for every message. That token carries a stable, anonymous ID for the person. The spec doesn't say whether that ID differs between companies; Poppy requires it to.

On its own, that tells the company which agent is calling but not who the person is, so its agent asks the way a chat widget would, for an order number or an email. If the company offers more, the person signs in on the company's own page with a code the agent shows them, then ticks the permissions they agree to, such as "look up your orders". The agent gets a token limited to those, meant to last an hour or less. When a request needs more, the company's agent says which permission is missing and the person approves again.

## Who's behind it

[Decagon](https://decagon.ai/blog/introducing-the-personal-agent-consent-trust-protocol-pact), which builds customer-support agents for businesses, open-sourced PACT on October 6, 2026, "co-developed and supported by Instinct", a personal-agent company. Decagon had first [named it on October 1](https://decagon.ai/blog/personal-agents-are-here). Instinct is also one of [Poppy's launch partners](https://sierra.ai/blog/poppy).

The spec, TypeScript packages at version 0.1.0, a reference Provider, a demo personal agent and conformance tests are in an [Apache-2.0 repository](https://github.com/openpactprotocol/openpactprotocol). The spec itself has no version number and no standards body. Decagon says it is also joining the Personal Agent Protocol working group "to help shape an industry standard", without saying how PACT and Poppy will relate.
