---
name: WebMCP
job: act
order: 1
status: early
status_note: Draft (Oct 27, 2026); Chrome and Edge trials; live in ChatGPT desktop and Shopify
tagline: page tools
phrase: A page hands typed tools to the agent in your browser
analogy: A labeled menu of actions for the agent in your browser.
looks_like: document.modelContext.registerTool()
when_to_use: When agents use your site in people's browsers. Add tools to your key flows and keep the normal page.
backers: W3C Web ML community group; Microsoft and Google editors
reality_check: Early use with two big real-world users, ChatGPT's desktop browser and Shopify, while Chrome and Edge are still in trials.
links:
  - label: Draft (Oct 27, 2026)
    url: https://webmachinelearning.github.io/webmcp/
  - label: Chrome docs
    url: https://developer.chrome.com/docs/ai/webmcp
  - label: Shopify's WebMCP tools
    url: https://shopify.dev/docs/api/web-mcp
related:
  - id: nlweb
    note: NLWeb is an endpoint on your server. WebMCP works inside the browser page.
  - id: ucp
    note: Shopify puts WebMCP tools on every Liquid storefront, next to its UCP support.
last_verified: "2026-10-30"
spec_sources:
  - kind: git-path
    repo: webmachinelearning/webmcp
    path: index.bs
    pin: "ce879543a9013dae3effe292e6deda0b4323a07d"
---

## How it works

More and more AI assistants work inside your browser, clicking and typing on the page for you. Today they mostly do it by looking: reading the page's code or a screenshot, guessing which box is "departure date," and hoping the "Book" button didn't move in last week's redesign.

WebMCP lets the site say it plainly. A page registers "tools" in JavaScript (`document.modelContext.registerTool()`) with a name, a plain-English description, the fields it expects and the function that does the work. Chrome also lets a site tag an existing form with two attributes, `toolname` and `tooldescription`, but the draft dropped that form option on October 8, 2026, so JavaScript tools are the safer choice. On a hair-salon site, the agent stops hunting for the calendar widget and calls `book_appointment` with a date, time and service. It all happens in your own tab and signed-in session, so you can watch and step in.

One caveat: a page's tool descriptions are text the AI reads, so a malicious site can try to trick the agent. [Chrome says agents must defend against this](https://developer.chrome.com/docs/agents/security), and [gives sites hints to flag untrusted text](https://developer.chrome.com/docs/ai/webmcp/secure-tools).

## Who's behind it

Microsoft and Google proposed it together in August 2025; the W3C's Web Machine Learning community group took it up that September, with editors from both companies. The current text is a [draft dated October 27, 2026](https://webmachinelearning.github.io/webmcp/) that says plainly it is "not a W3C Standard." A [draft W3C charter](https://w3c.github.io/charter-drafts/2026/agenticweb-wg.html) for a new Agentic Web Working Group would take WebMCP as its starting text, but that group does not exist yet.

[Chrome has been testing it](https://developer.chrome.com/docs/ai/webmcp) in a time-limited "origin trial" (Chrome 149-156) since May 2026; on September 28 [Google asked to extend the trial](http://www.mail-archive.com/blink-dev@chromium.org/msg17568.html) to Chrome 162 because feedback is still changing the API, so there's no ship date. On October 28, Google said [pages using the trial had passed 0.5% of all Chrome page loads](http://www.mail-archive.com/blink-dev@chromium.org/msg17895.html), though agents call the tools far less often. [Edge runs its own trial](https://developer.microsoft.com/en-us/microsoft-edge/origin-trials/trials/0b76fe60-b266-458e-a285-04e375c0c31a) (through March 30, 2027) and [calls it "ready for testing."](https://blogs.windows.com/msedgedev/2026/09/21/new-in-edge-for-developers-create-better-components-and-make-your-site-agent-ready/)

[ChatGPT's desktop browser calls these "site tools"](https://help.openai.com/en/articles/20001423-using-site-tools-in-the-chatgpt-desktop-app) automatically, and [Shopify puts WebMCP tools on every Liquid storefront](https://shopify.dev/docs/api/web-mcp) (and on Hydrogen stores from the 2026-10 release, unless turned off), including a [checkout tool that agents may only call after the buyer approves the order and total](https://shopify.dev/docs/agents/carts-and-checkout/checkout-webmcp). [Safari's team opposes it](https://github.com/WebKit/standards-positions/issues/670) and [Firefox is neutral](https://github.com/mozilla/standards-positions/issues/1412).

## Neighbours

MCP servers serve agents that never load your page, and computer-use agents that read the screen remain the fallback. A related layer, MCP Apps (not covered here yet), goes the other way: it lets an MCP server ship interactive UI into the agent's chat.
