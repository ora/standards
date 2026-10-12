---
name: NLWeb
job: act
order: 2
status: early
status_note: Spec v0.55; W3C group without chairs; no deployment count
tagline: ask a site
phrase: Ask a website questions in plain language
analogy: Your website's own shop assistant, one who answers from your stock list rather than making things up.
looks_like: /ask and /mcp
when_to_use: When you have lots of structured content and want people and agents to query it.
backers: Microsoft (R.V. Guha)
reality_check: Early. Nobody publishes a deployment count, partly because NLWeb has no fixed address to crawl.
links:
  - label: Source code
    url: https://github.com/nlweb-ai/NLWeb
  - label: Microsoft's announcement
    url: https://news.microsoft.com/source/features/company-news/introducing-nlweb-bringing-conversational-interfaces-directly-to-the-web/
  - label: Cloudflare one-click setup
    url: https://developers.cloudflare.com/ai-search/how-to/nlweb
  - label: W3C community group
    url: https://www.w3.org/community/nlweb
related:
  - id: webmcp
    note: WebMCP works inside the browser page. NLWeb is an endpoint on your server.
  - id: ai-catalog
    note: An AI catalog (or ARD file) can list your NLWeb endpoint.
last_verified: "2026-10-11"
---

## How it works

Most websites already describe their content in structured ways (Schema.org tags, RSS feeds), yet you can still only search them with keywords. NLWeb indexes that structured data and adds an "ask" endpoint: type "vegetarian recipes under 30 minutes without nuts" and get answers drawn only from that site.

Every NLWeb site is also an MCP server, so AI agents can ask the same questions through a standard plug. [Cloudflare offers a one-click "NLWeb Website" option](https://developers.cloudflare.com/ai-search/how-to/nlweb) that crawls your site and sets up an `/ask` page for people and an `/mcp` endpoint for agents.

## Who's behind it

[Microsoft introduced it](https://news.microsoft.com/source/features/company-news/introducing-nlweb-bringing-conversational-interfaces-directly-to-the-web/) at its Build conference on May 19, 2025; R.V. Guha conceived it. [The code is open source](https://github.com/nlweb-ai/NLWeb) and the current spec is v0.55.

A [W3C community group](https://www.w3.org/community/nlweb) launched in October 2025 but still has no chairs, 15 participants and no published reports, and community groups aren't a standards track, so NLWeb is not a W3C standard. Launch partners included Allrecipes, Eventbrite, Tripadvisor, O'Reilly and Shopify. A security bug that let attackers read server files was reported and fixed in mid-2025.
