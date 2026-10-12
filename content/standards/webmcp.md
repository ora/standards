---
name: WebMCP
job: act
order: 1
status: early
status_note: Draft (Oct 9, 2026); Chrome and Edge trials; live in ChatGPT desktop and Shopify
tagline: page tools
phrase: A page hands typed tools to the agent in your browser
analogy: A labeled menu of actions for the agent in your browser.
looks_like: document.modelContext.registerTool()
when_to_use: When agents use your site in people's browsers. Add tools to your key flows and keep the normal page.
backers: W3C Web ML community group; Microsoft and Google editors
reality_check: Early use with two big real-world users, ChatGPT's desktop browser and Shopify, while Chrome and Edge are still in trials.
links:
  - label: Draft (Oct 9, 2026)
    url: https://webmachinelearning.github.io/webmcp/
  - label: Chrome docs
    url: https://developer.chrome.com/docs/ai/webmcp
  - label: Shopify's WebMCP tools
    url: https://shopify.dev/docs/api/web-mcp
related:
  - id: nlweb
    note: NLWeb is an endpoint on your server. WebMCP works inside the browser page.
  - id: ucp
    note: Shopify puts WebMCP tools on every standard storefront, next to its UCP support.
last_verified: "2026-10-11"
---

## How it works

More and more AI assistants work inside your browser, clicking and typing on the page for you. Today they mostly do it by looking: reading the page's code or a screenshot, guessing which box is "departure date," and hoping the "Book" button didn't move in last week's redesign.

WebMCP lets the site say it plainly. A page registers "tools" in JavaScript (`document.modelContext.registerTool()`) with a name, a plain-English description, the fields it expects and the function that does the work, or tags an existing form with two attributes, `toolname` and `tooldescription`. On a hair-salon site, the agent stops hunting for the calendar widget and calls `book_appointment` with a date, time and service. It all happens in your own tab and signed-in session, so you can watch and step in.

One caveat: a page's tool descriptions are text the AI reads, so a malicious site can try to trick the agent, and Chrome says the defence is the agent's job.

## Who's behind it

Microsoft and Google proposed it together in August 2025; the W3C's Web Machine Learning community group took it up that September, with editors from both companies. The current text is a [draft dated October 9, 2026](https://webmachinelearning.github.io/webmcp/) that says plainly it is "not a W3C Standard."

[Chrome has been testing it](https://developer.chrome.com/docs/ai/webmcp) in a time-limited "origin trial" (Chrome 149-156) since May 2026; on September 28 [Google asked to extend the trial](http://www.mail-archive.com/blink-dev@chromium.org/msg17568.html) to Chrome 162 because feedback is still changing the API, so there's no ship date. [Edge runs its own trial](https://developer.microsoft.com/en-us/microsoft-edge/origin-trials/trials/0b76fe60-b266-458e-a285-04e375c0c31a) (since Edge 150, through March 30, 2027) and calls it "ready for testing."

[ChatGPT's desktop browser calls these "site tools"](https://help.openai.com/en/articles/20001423-using-site-tools-in-the-chatgpt-desktop-app) automatically, and [Shopify puts WebMCP tools on every standard storefront](https://shopify.dev/docs/api/web-mcp), including a [checkout tool that only completes after the buyer confirms](https://shopify.dev/docs/agents/carts-and-checkout/checkout-webmcp). [Safari's team opposes it](https://github.com/WebKit/standards-positions/issues/670) and [Firefox is neutral](https://github.com/mozilla/standards-positions/issues/1412).

## Neighbours

MCP servers serve agents that never load your page, and computer-use agents that read the screen remain the fallback. A related layer, MCP Apps (not covered here yet), goes the other way: it lets an MCP server ship interactive UI into the agent's chat.
