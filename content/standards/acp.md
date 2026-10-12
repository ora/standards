---
name: ACP
full_name: Agentic Commerce Protocol
job: shop
order: 2
status: production
status_note: Beta, stable 2026-04-17; live for discovery
tagline: into ChatGPT
phrase: Products (and checkout) into ChatGPT
analogy: A catalogue mailed straight to your personal shopper, with an optional order form attached.
looks_like: Product feeds + checkout endpoints
when_to_use: When you want your products shown in ChatGPT, especially if you already use Stripe.
backers: OpenAI + Stripe
reality_check: In production for discovery. The headline feature that launched ACP, buying inside ChatGPT, is exactly the part that was scaled back.
links:
  - label: Specification (GitHub)
    url: https://github.com/agentic-commerce-protocol/agentic-commerce-protocol
  - label: OpenAI on product discovery
    url: https://openai.com/index/powering-product-discovery-in-chatgpt/
related:
  - id: ucp
    note: Its rival. Stripe sits in both camps.
  - id: ap2
    note: A payment layer that can sit underneath.
  - id: x402
    note: Payment rails like MPP and x402 can sit underneath.
last_verified: "2026-10-11"
---

## How it works

ACP started as the plumbing for buying inside ChatGPT: a merchant shares a product feed and checkout endpoints, and payment travels as a one-time token tied to one merchant and one amount, so the assistant never holds your card number. The original idea: ask ChatGPT for a ceramic mug, see an Etsy seller's listing, and tap to buy without leaving the chat.

Today its main job is discovery: merchants push feeds and promotions so ChatGPT shows accurate, current products, prices and comparisons.

## Who's behind it

OpenAI and Stripe launched it on September 29, 2025, alongside "Instant Checkout" in ChatGPT. [The spec is still labeled beta](https://github.com/agentic-commerce-protocol/agentic-commerce-protocol); its latest stable version is dated April 17, 2026.

On March 24, 2026 OpenAI said it was [expanding ACP to support product discovery](https://openai.com/index/powering-product-discovery-in-chatgpt/), naming Target, Sephora, Nordstrom, Lowe's, Best Buy, The Home Depot and Wayfair as integrated, while checkout moved back to the merchant's side.
