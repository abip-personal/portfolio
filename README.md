# portfolio

The source for [portfolio.abip.pt](https://portfolio.abip.pt) — a static Astro
site that doubles as the artefact for one of the case studies it hosts.

## Why this repo is public

One of the entries on the site is about taking AI-assisted engineering to 100%
of an engineering org. Writing that up and then shipping the write-up through a
conventional hand-typed workflow would have been a bit of a contradiction, so
this site was built the way the case study describes: an agent doing the
typing, a human holding the gates.

The repo is the evidence. It is meant to be read, not just deployed.

## How it was actually built

Every change here was planned as a ticket, implemented by a coding agent
(Claude Code, driven through Orca worktrees), opened as a pull request, and
reviewed before merge. The commit log carries the ticket keys — `POR-3`,
`POR-13`, `POR-31`, `POR-41` — and the branch names survive in the merge
commits, so the path from "this needs doing" to "this is on the edge" is
readable end to end without any extra narration from me.

A few things that are worth looking at specifically, because they are the parts
where the agent's output needed a human to be right rather than merely
plausible:

- **`public/_headers`** — the CSP and caching rules carry long comments
  explaining *why* each trade-off was made: why `'unsafe-inline'` is
  unavoidable in `script-src` while Astro inlines the theme script, why
  `connect-src` was deliberately not widened for the analytics beacon, and why
  `Cross-Origin-Resource-Policy` on `/og/*` needs the `!` unset prefix. That
  last one (`POR-41`) was a real bug confirmed live: Worker Static Assets
  *accumulate* header rules rather than override them, so a bare
  re-declaration shipped both values and broke every social preview.
- **`audit/`** — an accessibility, responsive and contrast sweep run with
  headless Chromium, with the measurements written down rather than asserted.
  `REPORT.md` records the defects it caught, including a skip link that moved
  the scroll position but left focus on `<body>`.
- **`.github/workflows/ci.yml`** — type-check, build, an internal link check,
  and a Lighthouse budget, plus assertions that the OG cards and the feed
  actually landed in `dist/`. Generated assets fail silently otherwise; a
  broken social preview is not something you want to learn about from a
  recruiter.

## The TODOs are deliberate, and they are mine

Search the content collections and you will find roughly two dozen
`{/* TODO(diogo): ... */}` comments — six of them in the checkout case study
alone. They are questions the agent raised and then refused to answer on its
own: which datastore backs the order aggregate, what unit the velocity figure
is actually in, what gated the checkout migration, whether there are pilot
users, what the physical host in the homelab actually is.

**These are manual gates I still need to sort, not leftover scaffolding.** They
mark the exact line where the work stops being something an agent can finish.
Every one of them is a fact only I have, and the rule this repo was built under
is that the agent does not invent those — it flags them and stops. They do not
render on the site (MDX comments never reach the output), so the published
pages claim nothing that has not been verified; the questions stay visible here
until I sit down and answer them properly.

That rule was not free. Commit `7b873d3`, *"Remove fabricated content and take
the email address off the site"*, is what it looks like when it is not enforced
early enough. The TODOs are the mechanism that stopped it happening twice, and
leaving them in the public repo is the honest version of the case study: this
is how far the automation got, and here is precisely where it handed back.

## Stack

Astro 7 (`output: 'static'`) · MDX content collections with Zod schemas ·
Tailwind 4 · TypeScript · build-time OG card generation via resvg ·
deployed to Cloudflare Workers with Static Assets, no script entrypoint and no
bindings — the `[assets]` block is the whole Worker.

```sh
npm ci
npm run dev        # local dev server
npm run verify     # astro check + build + internal link check
npm run lighthouse # Lighthouse budget against dist/
```

Deploy specifics are in [`DEPLOY.md`](DEPLOY.md). The one-time Cloudflare
dashboard setup is account-specific and is not tracked here.

## A note on the content

The case studies about employer work are marked `confidential: true` in their
frontmatter, which renders a notice on the page. Everything in them stays
inside what can be said publicly about that work.
