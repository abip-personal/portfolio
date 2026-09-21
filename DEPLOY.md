# Deploying

The site is a fully static Astro build (`output: 'static'`) hosted on
**Cloudflare Workers with Static Assets**. There is no server runtime, no
script entrypoint and no binding — the Worker is an `[assets]` block and
nothing else, so requests are served straight from the edge asset store
without ever booting an isolate.

> **Why Workers and not Pages?** Cloudflare now positions Workers as the
> primary platform for new projects. Pages is still supported and still works,
> but it is no longer where new features land, and the two platforms have
> converged: Static Assets gives a static site the same edge serving, the same
> `_headers` support and the same free custom domains, while leaving the door
> open to adding a real Worker entrypoint later without migrating hosts.

> **One-time dashboard setup** (creating the Worker, connecting the repo,
> attaching the domain) is a manual, account-specific step and is not tracked
> in this repo. This file covers the repo-side config and the day-to-day
> deploy commands.

| Setting | Value |
| --- | --- |
| Platform | Cloudflare Workers (Static Assets) |
| Build command | `npm run build` |
| Assets directory | `dist` |
| Root directory | *(repository root)* |
| Node version | 24 |
| Production host | `portfolio.abip.pt` |

`wrangler.toml` already declares the `[assets]` block (`directory = "./dist"`,
`not_found_handling = "404-page"`), so the Wrangler path needs no extra flags.

Node 24 is not a preference, it is what the repo pins: `package.json` has
`"engines": { "node": ">=24" }` and `.github/workflows/ci.yml` uses
`node-version: 24`. Any build environment on an older Node will either refuse
to install or build something CI never tested.

---

## Option A — Workers Builds (recommended)

Cloudflare's Git integration for Workers. Pushes build and deploy themselves.

1. Cloudflare dashboard → **Workers & Pages** → the `portfolio` Worker →
   **Settings** → **Build** → **Connect** the repository.
2. Set the build command (`npm run build`) and leave the deploy command as
   `npx wrangler deploy`. The assets directory comes from `wrangler.toml`.
3. Add `NODE_VERSION = 24` as a build environment variable. (Cloudflare's
   default Node is older than Astro 7 supports; this is the one variable the
   build genuinely needs.)
4. Save. The next push to `main` deploys to production.

**Non-production branch builds are OFF by default on Workers.** This is the one
behavioural difference that bites people coming from Pages, where every branch
and PR got an automatic preview URL. If you want PR previews, turn on
non-production branch builds explicitly under the same **Build** settings; until
you do, only `main` builds.

## Option B — Wrangler from a terminal or another CI

```sh
npm ci
npm run build
npx wrangler login          # once per machine
npm run deploy              # = npm run build && wrangler deploy
```

`npm run deploy` reads `wrangler.toml`, so it picks up the Worker name and the
assets directory automatically. To publish a preview instead of production,
upload a *version* rather than deploying one — Workers preview URLs come from
versioned uploads, and there is no `--branch` flag:

```sh
npx wrangler versions upload
```

That prints a `<version-prefix>-portfolio.<subdomain>.workers.dev` preview URL
and changes nothing about what production is serving. Promote it later with
`npx wrangler versions deploy` if you want it live.

For non-interactive deploys (another CI, a local script), set:

- `CLOUDFLARE_API_TOKEN` — an API token with:
  - **Account → Workers Scripts → Edit**
  - **Account → Account Settings → Read**
  - **Zone → Workers Routes → Edit** (needed only for the custom domain/route)
- `CLOUDFLARE_ACCOUNT_ID` — the account ID from the dashboard sidebar

Both are secrets; never commit them. The GitHub Actions workflow in this repo
does **not** deploy — it only checks, builds and audits — so these are not
required unless you add a deploy step.

---

## Custom domain

Workers custom domains require the zone's nameservers to be Cloudflare-managed;
a partial (CNAME) setup is not enough. `abip.pt` must be a full zone in the same
Cloudflare account before step 2 will offer the domain.

1. Add `abip.pt` as a zone in Cloudflare and move its nameservers there if it is
   registered elsewhere.
2. Worker → **Settings** → **Domains & Routes** → **Add** → **Custom domain** →
   `portfolio.abip.pt`. Cloudflare creates the DNS record and provisions the
   certificate automatically.
3. There is exactly one canonical host and no second domain or redirect. The
   canonical URL, sitemap, RSS feed and OG image URLs are all derived from
   `SITE.url` in `src/data/site.ts` — if the production host ever changes,
   change it there and in `public/robots.txt`.
4. Leave **Always Use HTTPS** on. `public/_headers` already sends HSTS with
   `preload`; only submit the domain to the HSTS preload list once you are
   certain every subdomain can serve HTTPS.

---

## Headers, caching and routing

`_headers` **is** supported by Workers Static Assets — it carried over from
Pages unchanged, so `public/_headers` stays exactly as it is and needs no
migration. Two limits worth knowing before it grows: a maximum of **100 rules**
and a maximum of **2000 characters per line**. The CSP line is by far the
longest one here, so check it against that ceiling before extending it.

- `public/_headers` → copied to `dist/_headers` at build time. It sets the
  security headers (CSP, HSTS, frame/sniffing protection) and the cache policy:
  immutable one-year caching for `/_astro/*` (content-hashed), one day for OG
  cards, and `must-revalidate` for HTML so a deploy is visible immediately.
- Routing needs no config file. The old `public/_routes.json` was a Pages-only
  mechanism for declaring that no request needs a Function; on Workers that is
  simply what happens when `wrangler.toml` declares no `main` entrypoint, so the
  file has been deleted rather than translated.
- The CSP allows `'unsafe-inline'` for scripts and styles. This is deliberate and
  documented inline in `public/_headers`: `BaseLayout.astro` runs an `is:inline`
  theme script before first paint, and Astro inlines small stylesheets. Tighten
  this to hashes only if Astro starts emitting them for `is:inline` blocks.

To sanity-check the headers after a deploy:

```sh
curl -sI https://portfolio.abip.pt/ | grep -i -E 'content-security|strict-transport|cache-control'
curl -sI https://portfolio.abip.pt/_astro/ -o /dev/null -w '%{http_code}\n'
```

Note that `_headers` is **not** applied by `astro preview` or by the Lighthouse
CI static server — those serve raw files. Header behaviour can only be verified
against a real Workers deployment (a `versions upload` preview URL is fine).

---

## Rollback

Workers keeps every version and every deployment. From a terminal:

```sh
npx wrangler deployments list   # find the version you want
npx wrangler rollback           # or: npx wrangler rollback <version-id>
```

From the dashboard: the Worker → **Deployments** tab → pick a previous
deployment → roll back to it. Nothing needs to be rebuilt either way.

---

## What CI does

`.github/workflows/ci.yml` runs on every push to `main` and every PR:

1. `npm ci`
2. `npm run check` — `astro check` (types + content-collection schemas)
3. `npm run build`
4. Asserts `dist/og-default.png`, `dist/rss.xml`, `dist/_headers`,
   `dist/robots.txt` and `dist/sitemap-index.xml` exist and are well-formed
5. `npm run lint:links` — dependency-free internal link/anchor check over `dist/`
6. Lighthouse (3 runs, desktop preset) against a static server for `dist/`,
   asserting ≥ 0.95 for performance, accessibility, best-practices and SEO plus
   the resource-size and CLS/TBT budgets in `lighthouserc.json`

All four category assertions are blocking, and the current build scores 100 on
all four. Two deliberate carve-outs, both in `lighthouserc.json`:

- The `canonical` audit is skipped everywhere: the built pages point at the
  production host while CI serves them from `localhost`, so it can never pass
  locally. It is the only audit that cannot be meaningfully evaluated in CI.
- `/styleguide/` is exempt from the **SEO** category only (`assertMatrix`). That
  page is intentionally `noindex`, so Lighthouse's `is-crawlable` audit fails by
  design and pins the category at ~0.63. Performance, accessibility and
  best-practices are still held to >= 0.95 there.

`scripts/check-links.mjs` has two similar, clearly-marked lists: `SKIP_PAGES`
(the styleguide, whose demo buttons point nowhere on purpose) and
`KNOWN_PENDING` (targets such as the CV PDF that have not landed yet). Both are
meant to shrink to nothing as the site fills in.

Reproduce the whole thing locally with:

```sh
npm run verify      # check + build + link check
npm run lighthouse  # Lighthouse budget against dist/
```
