# ax.guide

**The Agentic-Web Cheatsheet**, live at [ax.guide](https://ax.guide): an open, plain-language field guide to the standards that let AI agents **find**, **act on**, **sign in to**, **shop on** and **pay** websites. For each one: what it does, who's behind it, and how real it is today.

Every standard is one Markdown file in [`content/standards/`](content/standards/). Fix a sentence or add a standard with a pull request; the site rebuilds from the files.

## What's on the site

| Page | What it shows |
| --- | --- |
| `/` | The map: every standard as a tile, grouped by the five jobs of an agent's visit, with a status filter |
| `/standards/<id>` | One standard: the picture, a reality check, how it works, who's behind it, sources, related standards |
| `/compare` | All of them side by side, plus the pairs people mix up |
| `/which` | Which one do I need? Start from what you're building |
| `/contribute` | How to edit, how status is decided, house style |

## Where things live

```
content/
  standards/<id>.md   one file per standard (front matter + Markdown)
  standards/_template.md   copy this to add one
  jobs.json           the five jobs, in map order
  pairs.json          the pairs people mix up (/compare)
  guide.json          "which one do I need?" (/which)
  home.json           home page text
  site.json           site shell: name, nav, footer, status labels
  contribute.md       the /contribute page
lib/
  schema.ts           the rules every standard's front matter must follow
  standards.ts        reads, checks and numbers the standards
app/                  pages (Next.js App Router), all built as static HTML
components/           small presentational components
tests/                checks every content file
```

Every page is static: there is no backend, no database and no tracking.

## Run it

You need Node 22 (see `.nvmrc`) and npm.

```sh
npm install
npm run dev        # http://localhost:3000
```

| Script | What it does |
| --- | --- |
| `npm run build` | Production build. Fails if any content file is invalid |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, no output |
| `npm test` | Content and unit tests (Vitest) |

## Deploy

The site is a standard Next.js app and deploys to Vercel with no settings: import the repository, keep the defaults, and every pull request gets its own preview. Canonical links and share images use, in order: the preview's branch address, `NEXT_PUBLIC_SITE_URL` (set to `https://ax.guide` in production), then Vercel's production address.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). The short version: one standard, one file; link a primary source for every claim; the status dot follows [strict rules](content/contribute.md#how-we-decide-the-status).

## Licenses

- Code: [MIT](LICENSE).
- Words in [`content/`](content/): [CC BY 4.0](content/LICENSE).

Maintained by [Ora](https://ora.ai) and contributors.
