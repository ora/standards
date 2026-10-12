## Fix a sentence

Every standard is one Markdown file in [`content/standards/`](https://github.com/ora/standards/tree/main/content/standards). At the foot of each standard's page there is an **Edit this page on GitHub** button. Make the change, say what was wrong, and link the source that shows it. That's the whole process.

Not sure what the fix should be? Use **Report an error** at the foot of any page. It opens an issue with the page filled in.

## Add a standard

1. Copy [`content/standards/_template.md`](https://github.com/ora/standards/blob/main/content/standards/_template.md) to `content/standards/<id>.md`. The `<id>` is the page address, in lowercase words joined by hyphens, like `web-bot-auth`.
2. Fill in every field at the top. The comments in the template say what each one is for.
3. Write two sections below it: **How it works** and **Who's behind it**. Add **Neighbours** if it is often confused with something.
4. Open a pull request. The checks tell you if a field is missing or a related standard doesn't exist, and a preview of the site is built for your branch.

A standard belongs here when it is **open** (anyone can read the spec), it is about **how AI agents work with websites and services**, and it fits one of the five jobs: find, act, identity, shop or pay. If it doesn't fit, open an issue first and we'll talk about a sixth job.

## How we decide the status

The status dot is the most-read thing on the site, so it follows strict rules.

- **In production**: public evidence of real traffic beyond the authors' own demos. Named deployments, an independent count, or a platform that has switched it on for its users.
- **Early use**: some real, public deployments, but small or still in trials.
- **Draft**: the spec is published, and no deployment is publicly known.

A partner list is not adoption, and a transaction count is not commerce. If a number comes from a secondary source, say so in the text ("according to an independent tracker...").

## Sources and freshness

- Link a primary source for every claim: the spec, the announcement, the repository or the standards body's page.
- Put the spec first in `links`.
- Change `last_verified` only when you have rechecked **every** claim on the page. Pages not checked for 90 days are marked as possibly out of date.

## House style

- Plain words and short sentences. Explain a term the first time it appears.
- One picture per standard in `analogy`, the kind you'd use to explain it to a friend.
- Dates as "October 9, 2026" in the text and `2026-10-09` in the fields.
- No em dashes. Use a colon, a semicolon or a new sentence.

## License

Words in `content/` are under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) and code under the [MIT License](https://github.com/ora/standards/blob/main/LICENSE). By opening a pull request you agree that your contribution is released under the same license as the files it changes.
