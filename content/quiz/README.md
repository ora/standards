# The quiz

[ax.guide/play](https://ax.guide/play) is a card game about the agentic web: the twelve standards on the map and the web plumbing they build on. It has two decks.

| Deck | Where it lives | A run | Who can play |
| --- | --- | --- | --- |
| **Open** | [`open.json`](open.json), plus one "Real or hype?" card per standard, written from its page | 12 cards, played in the browser | Anyone, no sign-up |
| **Expert** | Supabase, never this repository | 18 cards, dealt and scored by the server | Signed-in players; ranked on the leaderboard |

The expert deck is kept out of the repository on purpose. If its answers were on GitHub, the leaderboard would mean nothing.

## Cards

Each card is checked against [`lib/quiz-schema.ts`](../../lib/quiz-schema.ts), and `npm test` fails on a broken card. A card has:

- `id`: lowercase words and hyphens, starting with `o-` in the open deck and `x-` in the expert deck.
- `kind`: one of these four.
  - `quick`: a plain question.
  - `which`: "Which standard am I?"
  - `fake`: "Spot the fake". `answer` points at the made-up option.
  - `real`: "Real or hype?"
- `prompt`, `options` (two to four) and `answer` (the index of the right option).
- `explain`: one or two sentences shown after the answer. Make the player smarter even when they got it right.
- `standard`: the standard the card is about, if any. "Read more" links to its page.
- `source`: the primary source for the fact.
- `checked`: the day someone last checked the card.

Options are shuffled when a card is dealt, so an option can never depend on its position ("both of the above"). The exceptions are `real` cards and True/False cards, which keep their written order.

**Write cards that stay true.** Ask how a standard works, who made it, what it is for, and what it gets confused with. Avoid version numbers, deployment counts and "latest draft" dates: they change monthly. A standard's status is already asked by its generated "Real or hype?" card, whose answer changes the day its page does. The house style of [CONTRIBUTING.md](../../CONTRIBUTING.md) applies: plain words, no em dashes.

## Scoring

A right answer earns 100 points. Answering inside 3 seconds adds up to 50 more, sliding to nothing at 20 seconds. Each right answer in an unbroken streak adds 10 more, up to 50. A wrong answer, or running out of time, earns nothing and breaks the streak. The rules are in [`lib/quiz.ts`](../../lib/quiz.ts).

On an expert run the server deals each card and keeps time with its own clock. A card's clock stops when it is answered and starts again only when the next card is dealt, so reading an explanation costs nothing. A card can't be answered twice, and asking for it again doesn't restart its clock.

## Setting up the expert deck, sign-in and the leaderboard

The open quiz needs none of this. Without it, `/play` shows the expert deck and leaderboard as "soon".

1. **Create a Supabase project.** Open its SQL editor and run [`supabase/migrations/20261030000000_quiz.sql`](../../supabase/migrations/20261030000000_quiz.sql), or use `supabase db push` with the Supabase CLI. Every table has row level security and no policies, so only the site's server can read them.
2. **Turn on sign-in** (Authentication > Sign In / Providers): GitHub, Google and Email.
   - **GitHub:** create an OAuth app at github.com/settings/developers whose callback URL is `https://<project>.supabase.co/auth/v1/callback`.
   - **Google:** create an OAuth client in Google Cloud with the same callback.
   - **Email:** Supabase sends the magic links itself. Its built-in sender is rate-limited, so add your own SMTP (for example Resend) before launch.
3. **Set the redirect URLs** (Authentication > URL Configuration):
   - **Site URL:** `https://ax.guide`
   - **Redirect URLs:** `https://ax.guide/auth/callback`, `https://*-<your-team>.vercel.app/auth/callback` for previews, and `http://localhost:3000/auth/callback`
4. **Add the three variables** from [`.env.example`](../../.env.example) in Vercel (Project > Settings > Environment Variables). The service role key is a secret: keep it server-only.
5. **Load the expert deck.** Keep it in `private/quiz-expert.json`; the `private/` folder is gitignored. Run `npm run quiz:sql`: it checks the deck with the same tests as the open deck, then writes `private/quiz-expert.sql`. Run that file in the SQL editor. Re-running it updates changed cards, adds new ones and switches off cards you removed. Runs already in progress keep working.

Store the master copy of `quiz-expert.json` somewhere private, such as a private repository, a password manager or a private gist. The database holds a copy, but not a convenient one to edit.

## Players' data

A player's leaderboard name is their GitHub handle, or their first name and last initial, or `player-` and six characters. It is never their email. Runs are kept to rank them. Deleting a user in Supabase Auth deletes their profile and runs. Open runs never leave the browser.
