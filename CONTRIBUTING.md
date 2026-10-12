# Contributing to ax.guide

Thank you for helping. These standards change every month, so the guide stays right only if people fix it. You don't need to run anything to contribute: most changes are one Markdown file, edited on GitHub.

By taking part you agree to follow the [code of conduct](CODE_OF_CONDUCT.md).

## Ways to help

| You want to | Do this |
| --- | --- |
| Fix a wrong sentence or a stale status | Press **Edit on GitHub** at the foot of the standard's page, change the line, link your source, open a pull request. |
| Re-check a page | Check every claim against its sources, fix what changed, update `last_verified`. |
| Add a standard | Copy [`content/standards/_template.md`](content/standards/_template.md) to `content/standards/<id>.md` and fill it in. |
| Report a problem without fixing it | [Report an error](https://github.com/ora/standards/issues/new?template=correction.yml). |
| Suggest a standard without writing it | [Suggest a standard](https://github.com/ora/standards/issues/new?template=new-standard.yml). |

## How a standard file works

Each standard is one file in [`content/standards/`](content/standards/). The block at the top holds the facts (name, job, status, who's behind it, sources); the Markdown below holds the explanation, in two sections: **How it works** and **Who's behind it**. The template explains every field.

The build checks every file. A missing field, an unknown status, a malformed link, or a related standard that doesn't exist fails the check and names the file and the field, so you'll know exactly what to fix.

## What belongs here

A standard belongs on ax.guide when it is:

- **Open:** anyone can read the spec.
- **About agents and websites:** how AI agents find, use, sign in to, shop on or pay websites and services.
- **One of the five jobs:** find, act, identity, shop or pay. If it fits none, open an issue first and we'll talk about a sixth.

## The status rules

The status mark is the most-read thing on the site, so it follows strict rules.

- **In production:** public evidence of real traffic beyond the authors' own demos. Named deployments, an independent count, or a platform that has switched it on for its users.
- **Early use:** some real, public deployments, but small or still in trials.
- **Draft:** the spec is published, and no deployment is publicly known.

A partner list is not adoption, and a transaction count is not commerce. If a number comes from a secondary source, say so in the text ("according to an independent tracker...").

## Sources

- Link a primary source for every claim: the spec, the announcement, the repository, or the standards body's page.
- Put the spec first in `links`.
- Change `last_verified` only when you have rechecked **every** claim on the page.

## House style

- Plain words and short sentences. Explain a term the first time it appears.
- One picture per standard in `analogy`, the kind you'd use to explain it to a friend.
- Dates as "October 9, 2026" in the text and `2026-10-09` in the fields.
- No em dashes. Use a colon, a semicolon or a new sentence.

## Pull requests

- One standard, or one kind of change, per pull request.
- Say what changed and link the sources in the description; the template asks for both.
- Every pull request gets a preview deploy from Vercel and runs the checks. A maintainer reviews it before it merges.

## Changing code

You need Node 22 (see [`.nvmrc`](.nvmrc)) and npm.

```sh
npm install
npm run dev
```

Before you open a pull request, run the same checks CI runs:

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

If you added a standard or changed a name or a `phrase`, run `npm run readme` too: it regenerates the table of standards in the README, and the tests fail until it matches.

## License of contributions

Words in `content/` are under [CC BY 4.0](content/LICENSE), and the code under the [MIT License](LICENSE). By opening a pull request you agree that your contribution is released under the same license as the files it changes.
