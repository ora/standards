---
name: UCP
full_name: Universal Commerce Protocol
job: shop
order: 1
status: production
status_note: v2026-08-25; widely deployed via Shopify
tagline: agent shopping
phrase: A shared language for agent shopping
analogy: A universal power socket for shopping. Any assistant plugs into any store without a custom adapter.
looks_like: /.well-known/ucp
when_to_use: When you sell goods and want any AI assistant to browse, cart and check out.
backers: Google + Shopify, with governing and tech councils
reality_check: In production, and the most real of the twelve. According to an independent tracker, [UCP Checker](https://ucpchecker.com/blog/state-of-agentic-commerce-september-2026), about 17,800 stores had a working UCP profile on September 22, 2026, about 60% of them on Shopify and most of the rest on Wix. One catch is that the [August release](https://github.com/Universal-Commerce-Protocol/ucp/releases/tag/v2026-08-25) lists 11 groups of breaking changes, and about four in ten stores still declare the April version, so "supports UCP" doesn't tell you which version.
links:
  - label: Specification (ucp.dev)
    url: https://ucp.dev/
  - label: Announcements
    url: https://ucp.dev/documentation/announcements/
  - label: Release v2026-08-25
    url: https://github.com/Universal-Commerce-Protocol/ucp/releases/tag/v2026-08-25
related:
  - id: acp
    note: Its rival. UCP is for any assistant; ACP started as ChatGPT's plumbing.
  - id: ap2
    note: AP2 plugs in for payment consent; UCP's latest release has an AP2 extension.
  - id: poppy
    note: May overlap with UCP on sign-in.
last_verified: "2026-10-19"
spec_sources:
  - kind: git-latest-tag
    repo: Universal-Commerce-Protocol/ucp
    match: ^v\d{4}-\d{2}-\d{2}$
    pin: "v2026-08-25"
---

## How it works

UCP defines the common steps of buying (catalog, cart, checkout, order) and carries them over ordinary web APIs or the plugs agents already use (MCP, A2A). A store describes what it supports at `/.well-known/ucp`.

Ask Google's AI Mode for waterproof hiking boots under $150, and it compares several shops and checks out right in the chat, while the retailer stays the "merchant of record," the legal seller who handles returns and customer data.

## Who's behind it

[Google launched it with Shopify](https://blog.google/products/ads-commerce/agentic-commerce-ai-tools-protocol-retailers-platforms/) on January 11, 2026, co-developed with Etsy, Wayfair, Target and Walmart. A Governing Council has Google and Shopify as permanent members, and Stripe joined on April 28; a technical council added Amazon, Meta, Microsoft, Salesforce and Stripe in April, and [industry councils](https://ucp.dev/documentation/announcements/) for food, lodging and payments followed between July and September. A council seat isn't a storefront: Amazon being at the table doesn't mean Amazon sells through UCP.

The current release, [v2026-08-25](https://github.com/Universal-Commerce-Protocol/ucp/releases/tag/v2026-08-25), reorganized the spec so it can grow beyond shopping into food and lodging. It also added grocery features and an extra card check, called 3DS2, where the card's bank confirms the buyer. A first draft for hotel booking followed on September 25, 2026.
