# Cloudflare setup — what Diogo has to do by hand

Everything in this file needs a human in the Cloudflare dashboard or a human
holding a credential. Nothing here can be done by an agent, and the repo work in
POR-3 is blocked on the items marked **BLOCKING**.

Target decided 2026-09-18: **Cloudflare Workers with Static Assets**, not Pages.
Cloudflare now describes Workers as its primary platform for new projects; Pages
stays supported but is no longer the recommended starting point. The site is
100% static (`output: 'static'`), so the Worker has no script entrypoint at all —
it is an assets-only Worker.

Canonical host: **`portfolio.abip.pt`**. `diogoferreira.dev` is dropped entirely.

---

## 1. BLOCKING — Confirm the Cloudflare account and the `abip.pt` zone

Workers custom domains require the zone's nameservers to be managed by
Cloudflare. `abip.pt` already appears to be a Cloudflare zone (it is behind
Cloudflare Access with Google OAuth), so this should already be true.

Please confirm and send back:

- **Account ID** — Cloudflare dashboard → Workers & Pages → right-hand sidebar.
  Not a secret, but I cannot read it without access.
- That `abip.pt` is an active zone on that same account.

If `abip.pt` lives on a *different* Cloudflare account than the one you want the
Worker on, say so — the custom domain has to be attached from the account that
owns the zone, and that changes step 3.

---

## 2. BLOCKING — Give me a deploy credential

Two options. **Option A is the one I recommend** because it never puts a
long-lived secret on this machine.

### Option A — Workers Builds (Git integration)

Cloudflare builds and deploys from GitHub itself. No token is stored anywhere.

1. Dashboard → **Workers & Pages** → **Create** → **Import a repository**.
2. Pick `abip-personal/portfolio`, branch `main`.
3. Build settings:

   | Setting | Value |
   | --- | --- |
   | Build command | `npm run build` |
   | Deploy command | `npx wrangler deploy` |
   | Root directory | *(repository root)* |

4. Environment variables → add `NODE_VERSION = 24` for both production and
   non-production builds. The repo pins `"engines": { "node": ">=24" }` and CI
   runs Node 24; Cloudflare's default is older and the Astro 7 build will fail
   on it.
5. Enable **non-production branch builds** if you want preview URLs per branch.
   Unlike Pages, this is not on by default.

This has to be done once in the dashboard by you — the Git App install is an
OAuth grant against your GitHub account and cannot be scripted.

### Option B — API token, so I can deploy from this machine or from GitHub Actions

1. <https://dash.cloudflare.com/profile/api-tokens> → **Create Token** →
   **Edit Cloudflare Workers** template (or a custom token with exactly):

   | Scope | Permission |
   | --- | --- |
   | Account → Workers Scripts | Edit |
   | Account → Account Settings | Read |
   | Zone → Workers Routes | Edit (on `abip.pt`) |

   The site has no KV, R2, D1 or queues, so the template's storage permissions
   can be dropped.
2. Send me `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` **through a
   secret channel, not chat**. If they are going into GitHub Actions instead,
   add them as repository secrets under Settings → Secrets and variables →
   Actions and just tell me the names.

Never commit either value. `.gitignore` does not currently cover a `.dev.vars`
or `.env`, so do not create one at the repo root without adding it first.

---

## 3. BLOCKING — Custom domain `portfolio.abip.pt`

After the Worker exists (step 2 produces it):

1. Dashboard → **Workers & Pages** → the `portfolio` Worker → **Settings** →
   **Domains & Routes** → **Add** → **Custom domain**.
2. Enter `portfolio.abip.pt`.
3. Cloudflare creates the DNS record and provisions the certificate itself.
   Do **not** hand-create a CNAME for it first — a pre-existing record makes the
   custom domain attach fail.

Leave **Always Use HTTPS** on for the zone. `public/_headers` already sends HSTS
with `preload`; do not submit `abip.pt` to the HSTS preload list until every
subdomain on it can serve HTTPS, because preload applies to the whole apex.

---

## 4. BLOCKING — Exempt `portfolio.abip.pt` from Cloudflare Access

This is the one that will silently break the launch, and it is why POR-7 exists.

`abip.pt` is protected with Google OAuth via Cloudflare Access. If any existing
Access application is scoped to `*.abip.pt` or `abip.pt/*` with a wildcard, the
portfolio will inherit that auth wall and every visitor — including recruiters —
will hit a Google login screen instead of the site.

1. Dashboard → **Zero Trust** → **Access** → **Applications**.
2. Find every application whose hostname matches `abip.pt` broadly.
3. Either:
   - narrow its hostname to the specific subdomains that actually need auth, or
   - add a **Bypass** policy for `portfolio.abip.pt` with the selector
     **Everyone**, ordered *above* the Google OAuth policy.
4. Verify in an incognito window after the first deploy:

   ```sh
   curl -sI https://portfolio.abip.pt/ | head -n 1
   # want: HTTP/2 200        not: HTTP/2 302 -> cloudflareaccess.com
   ```

---

## 5. NON-BLOCKING — Analytics (POR-5 epic, listed here for completeness)

Cloudflare Web Analytics only. No GTM, no GA4. Because it is cookieless, no
consent banner is legally required — the epic ships a privacy page instead.

Dashboard → **Analytics & Logs** → **Web Analytics** → **Add a site** →
`portfolio.abip.pt`. Take the **beacon token** and send it to me. Note that the
beacon is a third-party script from `static.cloudflareinsights.com`, so
`public/_headers` will need its CSP widened for that one origin — right now
`script-src` and `connect-src` are `'self'` only and the beacon will be blocked.

---

## Verification checklist after the first deploy

```sh
curl -sI https://portfolio.abip.pt/ | head -n 1                      # 200, not a 302 to Access
curl -sI https://portfolio.abip.pt/ | grep -i -E 'content-security|strict-transport|cache-control'
curl -s  https://portfolio.abip.pt/robots.txt                        # must name portfolio.abip.pt
curl -s  https://portfolio.abip.pt/sitemap-index.xml | head -n 5     # must name portfolio.abip.pt
curl -sI https://portfolio.abip.pt/_astro/ -o /dev/null -w '%{http_code}\n'
curl -s  https://portfolio.abip.pt/does-not-exist -o /dev/null -w '%{http_code}\n'   # 404 page
```

`_headers` is not applied by `astro preview` or by the Lighthouse CI static
server — those serve raw files. Header behaviour can only be verified against a
real deployment.

---

## Rollback

Workers keeps every version. Dashboard → the Worker → **Deployments** → pick a
previous version → **Rollback**. Or from a terminal:

```sh
npx wrangler deployments list
npx wrangler rollback [<version-id>]
```
