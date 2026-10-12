# Security policy

ax.guide is a static site: no backend, no database, no accounts and no tracking. The risks that matter here are in the code that builds and serves it, and in the content it publishes.

## Report a vulnerability

Please report security issues **privately**, through GitHub's form: [report a vulnerability](https://github.com/ora/standards/security/advisories/new). Only the maintainers can see it. Do not open a public issue for a security problem.

Include what you found, where (a file, a URL or a commit), and how to reproduce it. We aim to reply within a week and will credit you in the fix unless you'd rather we didn't.

## In scope

- The site's code: anything in this repository that could run script in a visitor's browser, change response headers, or leak data.
- The content pipeline: Markdown or front matter that renders as live HTML or script, or links that send visitors somewhere other than what the page says.
- The build and CI setup in `.github/`.

## Out of scope

- The standards themselves. A flaw in ARD, WebMCP, x402 or any other standard belongs with its authors; each page links their spec and repository.
- A wrong fact or a stale status. That's a correction: [report an error](https://github.com/ora/standards/issues/new?template=correction.yml) instead.

## Supported versions

Only the live site at [ax.guide](https://ax.guide), built from `main`, is supported.
