---
name: MPP
full_name: Machine Payments Protocol
job: pay
order: 2
status: early
status_note: Individual IETF draft -01 (Sept 9, 2026); live on Tempo
tagline: card or crypto
phrase: Pay inside a web request, card or crypto
analogy: A turnstile that takes a tap of your card. No account, no membership; pay and walk through.
looks_like: 402 Payment Required
when_to_use: When agents pay per call or by the minute and you want cards and stablecoins via Stripe.
backers: Stripe + Tempo
reality_check: Early use, live on Tempo. Unlike x402, no neutral foundation owns it; it's written and maintained by two companies with a commercial stake.
links:
  - label: mpp.dev
    url: https://mpp.dev/
  - label: IETF draft (-01)
    url: https://datatracker.ietf.org/doc/draft-httpauth-payment/01/
related:
  - id: x402
    note: MPP now accepts x402's simplest payment flow, so the two are more compatible than competing.
  - id: ap2
    note: AP2 records what a person approved; MPP moves the money.
last_verified: "2026-10-11"
---

## How it works

Paying for an online service usually means signing up, getting a key and setting up billing, which an autonomous agent can't easily do. MPP uses the web's long-unused "402 Payment Required" code: the server replies "this costs 2 cents, here's how to pay," the client pays, and the server returns the result plus a receipt.

It supports one-off charges, subscriptions and streaming pay-as-you-go "sessions," with stablecoins on Stripe's Tempo blockchain or ordinary cards through Stripe. Picture a research agent paying a fraction of a cent per article from a paywalled archive and settling the total when it finishes.

## Who's behind it

[Stripe and Tempo launched it](https://mpp.dev/) on March 18, 2026, the same day Tempo's payments blockchain went live. Its core spec is an IETF Internet-Draft ([draft-httpauth-payment-01](https://datatracker.ietf.org/doc/draft-httpauth-payment/01/), September 9, 2026), but an *individual* one: the IETF lists it as having no formal standing, and no working group has taken it on.

The ecosystem is growing (Circle drafted a USDC payment method), and MPP now accepts x402's simplest payment flow from the same toolkit.
