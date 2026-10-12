---
name: AP2
full_name: Agent Payments Protocol
job: pay
order: 1
status: early
status_note: v0.2 (Apr 28, 2026); early standardization
tagline: user consent
phrase: Signed proof of what you authorized
analogy: A signed, notarized shopping list, with a spending limit the bank can check before paying.
looks_like: Signed mandates
when_to_use: When an agent pays and you need proof a person approved those exact terms. Still early.
backers: Google, now at the FIDO Alliance
reality_check: Early. Real use is mostly inside other protocols, like the AP2 extension in UCP's latest release; consumer-facing AP2 checkout is still limited.
links:
  - label: Specification (GitHub)
    url: https://github.com/google-agentic-commerce/AP2
  - label: Handover to FIDO
    url: https://blog.google/products-and-platforms/platforms/google-pay/agent-payments-protocol-fido-alliance/
  - label: FIDO working groups
    url: https://fidoalliance.org/fido-alliance-to-develop-standards-for-trusted-ai-agent-interactions/
related:
  - id: ucp
    note: Most real use today is the AP2 extension in UCP's latest release.
  - id: x402
    note: AP2 authorizes a payment; it can settle through x402.
  - id: mpp
    note: Another way to actually move the money.
last_verified: "2026-10-11"
---

## How it works

When an agent pays, the bank and merchant need answers to "did a real person agree to this?" and "who's liable if it goes wrong?" AP2 answers with *mandates*, tamper-proof signed records of your instructions:

- An **intent mandate** captures what you asked for ("concert tickets, under $200, this week").
- A **cart mandate** locks the exact items and price.
- A **payment mandate** tells the card network an agent was involved.

Version 0.2 adds "Human Not Present" purchases: you pre-sign the rules, and the agent buys later when conditions are met, say when tickets go on sale at 3 a.m. It works with cards, bank transfers and stablecoins. AP2 authorizes payments; it doesn't process them.

## Who's behind it

Google announced it on September 16, 2025 with more than 60 organizations, including American Express, Coinbase, Mastercard, PayPal and Salesforce. On April 28, 2026 Google [released v0.2](https://github.com/google-agentic-commerce/AP2) and [handed AP2 to the FIDO Alliance](https://blog.google/products-and-platforms/platforms/google-pay/agent-payments-protocol-fido-alliance/) (the group behind passkeys), which [formed working groups](https://fidoalliance.org/fido-alliance-to-develop-standards-for-trusted-ai-agent-interactions/) chaired by members from Google, OpenAI, CVS Health, Visa and Mastercard.

Mastercard's Verifiable Intent, a similar auditable record of what a user approved, co-developed with Google, went to FIDO at the same time. FIDO's work is only months old, so v0.2 isn't yet a FIDO-approved standard.
