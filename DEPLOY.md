# Deploying

The site is a fully static Astro build (`output: 'static'`) hosted on
**Cloudflare Pages**. There is no server runtime, no Pages Function and no
binding — Pages serves `dist/` and nothing else.

| Setting | Value |
| --- | --- |
| Framework preset | Astro (or "None") |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | *(repository root)* |
| Node version | 22 |

`wrangler.toml` already declares `pages_build_output_dir = "dist"`, so the
Wrangler path needs no extra flags.

---

## Option A — Git integration (recommended)

Pushes build and deploy themselves; PRs get preview URLs.

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** →
   **Connect to Git**, and pick this repository.
2. Set the build command and output directory from the table above.
3. Under **Environment variables** → **Production**, add `NODE_VERSION = 22`.
   Do the same for **Preview**. (Cloudflare's default Node is older than Astro 7
   supports; this is the one variable the build genuinely needs.)
4. **Save and Deploy**.

From then on: every push to `main` deploys to production, and every other branch
and PR gets its own `<hash>.<project>.pages.dev` preview.

## Option B — Wrangler from a terminal or another CI

```sh
npm ci
npm run build
npx wrangler login          # once per machine
npm run deploy              # = npm run build && wrangler pages deploy
```

`npm run deploy` reads `wrangler.toml`, so it picks up the project name and
`dist/` automatically. To deploy a branch as a preview instead of production:

```sh
npx wrangler pages deploy --branch preview
```

For non-interactive deploys (another CI, a local script), set:

- `CLOUDFLARE_API_TOKEN` — an API token with **Account → Cloudflare Pages → Edit**
- `CLOUDFLARE_ACCOUNT_ID` — the account ID from the dashboard sidebar

Both are secrets; never commit them. The GitHub Actions workflow in this repo
does **not** deploy — it only checks, builds and audits — so these are not
required unless you add a deploy step.

---

## Custom domain

1. Add the domain (or subdomain) as a zone in Cloudflare, or move its nameservers
   to Cloudflare if it is registered elsewhere.
2. Pages project → **Custom domains** → **Set up a custom domain** →
   `diogoferreira.dev`. Cloudflare creates the `CNAME`/flattened `A` record and
   provisions the certificate automatically.
3. Repeat for `www.diogoferreira.dev` if you want it, then add a **Redirect Rule**
   sending `www` → apex (301) so there is a single canonical host. The canonical
   URL, sitemap, RSS feed and OG image URLs are all derived from `SITE.url` in
   `src/data/site.ts` — if the production host ever changes, change it there and
   in `public/robots.txt`.
4. Leave **Always Use HTTPS** on. `public/_headers` already sends HSTS with
   `preload`; only submit the domain to the HSTS preload list once you are
   certain every subdomain can serve HTTPS.

---

## Headers, caching and routing

- `public/_headers` → copied to `dist/_headers` at build time. It sets the
  security headers (CSP, HSTS, frame/sniffing protection) and the cache policy:
  immutable one-year caching for `/_astro/*` (content-hashed), one day for OG
  cards, and `must-revalidate` for HTML so a deploy is visible immediately.
- `public/_routes.json` → declares that no request needs a Pages Function, so
  everything is served straight from static assets.
- The CSP allows `'unsafe-inline'` for scripts and styles. This is deliberate and
  documented inline in `public/_headers`: `BaseLayout.astro` runs an `is:inline`
  theme script before first paint, and Astro inlines small stylesheets. Tighten
  this to hashes only if Astro starts emitting them for `is:inline` blocks.

To sanity-check the headers after a deploy:

```sh
curl -sI https://diogoferreira.dev/ | grep -i -E 'content-security|strict-transport|cache-control'
curl -sI https://diogoferreira.dev/_astro/ -o /dev/null -w '%{http_code}\n'
```

Note that `_headers` is **not** applied by `astro preview` or by the Lighthouse
CI static server — those serve raw files. Header behaviour can only be verified
against a real Pages deployment (a preview URL is fine).

---

## Rollback

Pages keeps every deployment. Dashboard → the project → **Deployments** → pick a
previous one → **Rollback**. Nothing needs to be rebuilt.

---

## What CI does

`.github/workflows/ci.yml` runs on every push and PR:

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
