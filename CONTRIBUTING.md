# Contributing

Thank you for helping keep this guide accurate. These standards change every month, so the most useful contributions are corrections, fresh status, and new standards.

The full guide (how to add a standard, how status is decided, house style) lives in [`content/contribute.md`](content/contribute.md) and is published at `/contribute` on the site. The essentials:

## Fix a sentence

1. Find the standard's file in [`content/standards/`](content/standards/), or use **Edit this page on GitHub** at the foot of its page.
2. Make the change.
3. Open a pull request. Say what was wrong and link the source that shows it.

## Add a standard

1. Copy [`content/standards/_template.md`](content/standards/_template.md) to `content/standards/<id>.md`.
2. Fill in every field, and write **How it works** and **Who's behind it**.
3. Open a pull request. CI checks every field, and Vercel builds a preview of your branch.

## The rules that matter most

- **Every claim links a primary source**: the spec, the announcement, the repository or the standards body's page.
- **Status is evidence, not announcements.** *In production* means public evidence of real traffic beyond the authors' own demos. A partner list is not adoption.
- **Only change `last_verified` when you've rechecked every claim** on that page. Pages older than 90 days are marked as possibly out of date.
- **House style**: plain words, short sentences, no em dashes.

## Code changes

Run these before you open a pull request:

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

## License of contributions

Words in `content/` are under [CC BY 4.0](content/LICENSE), and the code under the [MIT License](LICENSE). By opening a pull request you agree that your contribution is released under the same license as the files it changes.
