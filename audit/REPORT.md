# Accessibility + responsive audit

## Step 1: Horizontal overflow

Measured with headless Chromium via Playwright against `npx astro preview` on :4331, after setting `document.documentElement.dataset.theme`.

| route | width | theme | scrollWidth | innerWidth | status |
|---|---|---|---|---|---|
| home | 360 | light | 360 | 360 | OK |
| home | 360 | dark | 360 | 360 | OK |
| home | 768 | light | 768 | 768 | OK |
| home | 768 | dark | 768 | 768 | OK |
| home | 1280 | light | 1280 | 1280 | OK |
| home | 1280 | dark | 1280 | 1280 | OK |
| home | 1920 | light | 1920 | 1920 | OK |
| home | 1920 | dark | 1920 | 1920 | OK |
| work-index | 360 | light | 360 | 360 | OK |
| work-index | 360 | dark | 360 | 360 | OK |
| work-index | 768 | light | 768 | 768 | OK |
| work-index | 768 | dark | 768 | 768 | OK |
| work-index | 1280 | light | 1280 | 1280 | OK |
| work-index | 1280 | dark | 1280 | 1280 | OK |
| work-index | 1920 | light | 1920 | 1920 | OK |
| work-index | 1920 | dark | 1920 | 1920 | OK |
| creoate-checkout | 360 | light | 360 | 360 | OK |
| creoate-checkout | 360 | dark | 360 | 360 | OK |
| creoate-checkout | 768 | light | 768 | 768 | OK |
| creoate-checkout | 768 | dark | 768 | 768 | OK |
| creoate-checkout | 1280 | light | 1280 | 1280 | OK |
| creoate-checkout | 1280 | dark | 1280 | 1280 | OK |
| creoate-checkout | 1920 | light | 1920 | 1920 | OK |
| creoate-checkout | 1920 | dark | 1920 | 1920 | OK |
| agriluso | 360 | light | 360 | 360 | OK |
| agriluso | 360 | dark | 360 | 360 | OK |
| agriluso | 768 | light | 768 | 768 | OK |
| agriluso | 768 | dark | 768 | 768 | OK |
| agriluso | 1280 | light | 1280 | 1280 | OK |
| agriluso | 1280 | dark | 1280 | 1280 | OK |
| agriluso | 1920 | light | 1920 | 1920 | OK |
| agriluso | 1920 | dark | 1920 | 1920 | OK |
| blog | 360 | light | 360 | 360 | OK |
| blog | 360 | dark | 360 | 360 | OK |
| blog | 768 | light | 768 | 768 | OK |
| blog | 768 | dark | 768 | 768 | OK |
| blog | 1280 | light | 1280 | 1280 | OK |
| blog | 1280 | dark | 1280 | 1280 | OK |
| blog | 1920 | light | 1920 | 1920 | OK |
| blog | 1920 | dark | 1920 | 1920 | OK |

No overflow detected on any route/width/theme combination.



## Step 2: Keyboard & focus

Checked on `/` and `/work/creoate-checkout/` with headless Chromium (Playwright 1.63.0), 1280px viewport unless noted. Focus ring = computed `outline` on `:focus-visible` (global rule: `2px solid var(--accent), offset 2px`).

### Tab order (both routes)
- Checked, no defects: **skip link is the first tab stop** on both routes (`<a.skip-link>` "Skip to content", ring rendered: `2px solid rgb(14, 76, 143)`).
- Order on `/`: skip link → wordmark → nav (Work, Experience, Off the clock, Contact) → theme toggle → hero CTAs → email → project cards (×5) → summary links (×2) → contact/footer links (Email me, LinkedIn, Download CV, email, LinkedIn, CV (PDF)) → cycles back to body. No hidden or unreachable interactive elements; all stops are labelled links.
- Order on `/work/creoate-checkout/`: skip link → wordmark → nav → theme toggle → "← All work" → "Next: Agriluso" → "Get in touch" → "See all work" → footer (LinkedIn, CV (PDF)) → cycles back to body.
- Checked, no defects: a visible focus ring (2px solid accent outline) is rendered on **every** tab stop on both routes (measured via computed `outline-style: solid` at each stop).

### Skip link activation
- **DEFECT (found & fixed):** activating the skip link (Enter / click) scrolled to `#main` but focus stayed on `<body>` — `<main>` was not focusable. Fix: added `tabindex="-1"` to `<main id="main">` in `src/layouts/BaseLayout.astro`, plus `#main:focus, #main:focus-visible { outline: none }` in `src/styles/global.css` so the target doesn't draw a full-page outline (token values untouched, no renames). Re-measured after `npx astro build`: on both routes `document.activeElement` after activation is `MAIN#main`, outline `3px none` (not rendered).

### Theme toggle accessible name
- Checked, no defects: verified with Playwright's accessibility tree (`ariaSnapshot`), not DOM text: light theme → `button "Switch to dark theme"`, dark theme → `button "Switch to light theme"`. The label is correct in both states and swaps with the toggle.

### Mobile nav (<details>/<summary>, SiteHeader) at 360px
- Checked, no defects: focused `<summary>` (visually "Menu"), pressed Enter → `details[open]=true`; first Tab stop after opening is the first in-menu link (inside `.site-nav`); Enter on summary again → `details[open]=false`. Fully keyboard-operable in both directions.


## Step 3: Reduced motion

Emulated `prefers-reduced-motion: reduce` via Playwright context `reducedMotion:'reduce'` and compared with `no-preference` on `/` (1280px, content asserted after `networkidle`). With no-preference, 34 elements carry an effective non-zero `animation-duration`/`transition-duration`; under reduce, **0** do — the global `* , ::before, ::after` override in `global.css` is taking effect (site-observed: `matchMedia('(prefers-reduced-motion: reduce)').matches` was `true` in-page). Content parity is exact: 22 headings, 7 `/work/…` links, and 7,481 characters of innerText in both modes, `body` opacity 1. Nothing is hidden or left mid-animation under reduced motion.


## Step 4: Visual review of screenshots

20 screenshots captured under `audit/screenshots/` (5 routes x {360, 1280} x {light, dark}).

Reviewed by the coordinator (the worker's dispatch died on a provider API error —
`500: "no user query found in messages"` after 3 retries — before writing this section;
the screenshots themselves had already been captured).

- **DEFECT (found & fixed): footer floated mid-viewport on short pages.** On `/blog/`
  at 1280x900 the document was shorter than the viewport, so the footer ended at
  y=790 leaving a ~110px dead band of `--surface` beneath it, which read as a
  rendering fault rather than a design. Fixed with a standard sticky-footer layout:
  `body { display: flex; flex-direction: column; min-height: 100dvh }` and
  `body > main { flex: 1 0 auto }` in `src/styles/global.css`.
  Re-measured after rebuild at 1280x900 on `/blog/`: footer bottom 900, gap below
  footer 0, `scrollHeight` 900. No horizontal scroll introduced — re-checked
  `/work/creoate-checkout/` at 360 and 1280 in both themes: 345/360 and 1265/1280.
- Dark theme renders correctly across all five routes: surfaces, borders and the
  gradient treatments all resolve, no unstyled or transparent regions.
- The mobile architecture diagram on `/work/creoate-checkout/` is legible at 360px
  (it is a separate portrait variant, not the wide desktop diagram scaled down).
- No text overlap, clipped containers, or orphaned headings observed.

## Post-audit verification (coordinator, after the sticky-footer fix)

Re-ran the full gate on the final tree:

- `npx astro check` -> 0 errors, 0 warnings
- `npx astro build` -> 8 pages
- `node scripts/check-links.mjs` -> exit 0, no broken internal links
  (`/diogo-ferreira-cv.pdf` remains known-pending: the PDF does not exist yet)
- `npm run lighthouse` -> exit 0, 24 runs across all 8 pages. Minimum score per page:

  | page | perf | a11y | best-practices | seo |
  |---|---|---|---|---|
  | / | 1.00 | 1.00 | 1.00 | 1.00 |
  | /blog/ | 1.00 | 1.00 | 1.00 | 1.00 |
  | /work/ | 1.00 | 1.00 | 1.00 | 1.00 |
  | /work/creoate-checkout/ | 1.00 | 1.00 | 1.00 | 1.00 |
  | /work/agriluso/ | 1.00 | 1.00 | 1.00 | 1.00 |
  | /work/ai-assisted-engineering/ | 1.00 | 1.00 | 1.00 | 1.00 |
  | /work/regulated-gaming/ | 1.00 | 1.00 | 1.00 | 1.00 |
  | /styleguide/ | 1.00 | 1.00 | 1.00 | 0.63* |

  *`/styleguide/` is deliberately `noindex`, so `is-crawlable` fails by design. It is
  exempt from the SEO assertion only; its other three categories are still blocking.

## Not verified

- Real-device testing (iOS Safari, Android Chrome). All measurements above are
  headless Chromium via Playwright.
- Screen-reader testing with an actual AT (VoiceOver/NVDA). Accessible names and
  roles were verified through the accessibility tree, which is not the same thing.
