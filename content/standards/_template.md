---
# Copy this file to content/standards/<id>.md. The <id> becomes the page
# address (/standards/<id>): lowercase words joined by hyphens.
# Files whose names start with "_" are not published.

# The short name people use.
name: Example
# The name written out, if it differs. Delete the line if not.
full_name: Example Protocol
# One of: find, act, identity, shop, pay.
job: find
# Position inside its job on the map: 1 is first. Must be unique within the job.
order: 9
# One of: production, early, draft. See /contribute for the rules.
status: draft
# Latest version and date, and a word on real use.
status_note: Draft 0.1 (Jan 1, 2027); no known deployments
# Two or three words for the map tile (24 characters at most).
tagline: example job
# The job in one phrase, for the comparison table.
phrase: Does one thing for an agent
# One plain picture of what it is.
analogy: A short, friendly comparison.
# What an agent actually meets: a file path, a function or a status code.
looks_like: /.well-known/example.json
when_to_use: When you want agents to do one thing.
backers: Who wrote it and where it is being standardized
# How real it is today. Inline Markdown; link your sources.
reality_check: Draft. No company is publicly known to use it yet.
# Primary sources. Put the spec first.
links:
  - label: Specification
    url: https://example.com/spec
# Other standards it is often mixed up with or used next to. Optional.
related:
  - id: ard
    note: How the two relate, in one sentence.
# The day you checked every claim on this page against its sources.
last_verified: "2027-01-01"
# Where the spec lives, so a weekly check can tell you when it changes. Each
# pin is the exact state you read: the check opens an issue when the live
# spec no longer matches it. Kinds (see scripts/spec-drift.mjs):
#   git-path        repo + path: a file or folder in a Git repository
#   git-head        repo: any change anywhere in a small, spec-only repository
#   git-dated-dirs  repo + path: a newer dated revision folder, such as spec/2026-04-17
#   git-latest-tag  repo + match: a newer release tag
#   ietf-draft      name: a new revision of an IETF draft
#   page            url: a spec that is only a web page
# Get the pin of a new source by running `node scripts/spec-drift.mjs check
# spec-pins.json --only <id>` with any placeholder pin, and copy the live value.
spec_sources:
  - kind: git-path
    repo: example/spec
    path: spec.md
    pin: "0000000000000000000000000000000000000000"
---

## How it works

What problem it solves, in plain words, and one concrete example.

## Who's behind it

Who wrote it, when, where it is being standardized, and who uses it. Link a source for each claim.
