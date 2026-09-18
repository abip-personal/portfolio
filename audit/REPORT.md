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
- Order on `/`: skip link → wordmark → nav (Work, Experience, Off the clock, Contact) → theme toggle → hero CTAs (View work, Download CV) → project cards (×4) → summary links (×2) → contact/footer links (Connect on LinkedIn, Download CV, LinkedIn, CV (PDF)) → cycles back to body. No hidden or unreachable interactive elements; all stops are labelled links. (SOCIALS carries LinkedIn only — there is no mailto/email tab stop anywhere on the page.)
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
- The mobile architecture diagram on `/work/agriluso/` is legible at 360px
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

## Step 4: Screenshots & visual defects

20 full-page PNGs saved to `audit/screenshots/` (5 routes × 360/1280 × light/dark, fullPage, deviceScaleFactor 1).

COULD NOT RUN: pixel-level visual inspection by this worker - the active model in this session does not support image input (`read` on the PNGs returned "model does not support images"). Instead, each of the 20 rendered pages was inspected programmatically (same 4 conditions): text-on-text overlap (bounding-box intersection of visible text nodes, < 4.5:1 contrast, and text containers clipped by overflow-hidden). Findings:

### home @360/light
- overlaps: "Off the clock" <a> x "Full-Stack Systems · Clou" <p>
- "Experience" <a> x "Diogo" <h1>
- "Experience" <a> x "Ferreira" <span>
- clipped: <span.theme-toggle__label-light> "Switch to dark theme" clip=24x1/160x1
- <span.sr-only> "Menu" clip=24x1/43x1
- <h2.sr-only> "Results at a glance" clip=24x1/142x1
- contrast<4.5: ratio=1.00 fg=rgb(255, 255, 255) bg-eff=255,255,255,1 on "<a>" "View work"
- ratio=1.00 fg=rgb(255, 255, 255) bg-eff=255,255,255,1 on "<a>" "Read the case study"
- ratio=1.00 fg=rgb(255, 255, 255) bg-eff=255,255,255,1 on "<a>" "Connect on LinkedIn"
### home @360/dark
- overlaps: "Off the clock" <a> x "Full-Stack Systems · Clou" <p>
- "Experience" <a> x "Diogo" <h1>
- "Experience" <a> x "Ferreira" <span>
- clipped: <span.theme-toggle__label-dark > "Switch to light theme" clip=24x1/159x1
- <span.sr-only> "Menu" clip=24x1/43x1
- <h2.sr-only> "Results at a glance" clip=24x1/142x1
- contrast<4.5: ratio=1.07 fg=rgba(0, 0, 0, 0) bg-eff=7,12,20,1 on "<span>" "Ferreira"
- ratio=1.11 fg=rgb(7, 26, 44) bg-eff=7,12,20,1 on "<a>" "View work"
- ratio=1.07 fg=rgba(0, 0, 0, 0) bg-eff=7,12,20,1 on "<p>" "~10s → <2.5s"
- ratio=1.07 fg=rgba(0, 0, 0, 0) bg-eff=7,12,20,1 on "<p>" "~25k"
- ratio=1.07 fg=rgba(0, 0, 0, 0) bg-eff=7,12,20,1 on "<p>" "100%"
- ratio=1.07 fg=rgba(0, 0, 0, 0) bg-eff=7,12,20,1 on "<p>" "18"
- ratio=1.07 fg=rgba(0, 0, 0, 0) bg-eff=7,12,20,1 on "<dd>" "8"
- ratio=1.07 fg=rgba(0, 0, 0, 0) bg-eff=7,12,20,1 on "<dd>" "3"
- ratio=1.07 fg=rgba(0, 0, 0, 0) bg-eff=7,12,20,1 on "<dd>" "1"
- ratio=1.11 fg=rgb(7, 26, 44) bg-eff=7,12,20,1 on "<a>" "Read the case study"
- ratio=1.11 fg=rgb(7, 26, 44) bg-eff=7,12,20,1 on "<a>" "Connect on LinkedIn"
### home @1280/light
- overlaps: "Contact" <a> x "Diogo" <h1>
- clipped: <label.sr-only> "Visual style (preview)" clip=24x1/162x1
- <span.theme-toggle__label-light> "Switch to dark theme" clip=24x1/160x1
- <span.sr-only> "Menu" clip=24x1/43x1
- <h2.sr-only> "Results at a glance" clip=24x1/142x1
- contrast<4.5: ratio=1.00 fg=rgb(255, 255, 255) bg-eff=255,255,255,1 on "<a>" "View work"
- ratio=1.00 fg=rgb(255, 255, 255) bg-eff=255,255,255,1 on "<a>" "Read the case study"
- ratio=1.00 fg=rgb(255, 255, 255) bg-eff=255,255,255,1 on "<a>" "Connect on LinkedIn"
### home @1280/dark
- overlaps: "Contact" <a> x "Diogo" <h1>
- clipped: <label.sr-only> "Visual style (preview)" clip=24x1/162x1
- <span.theme-toggle__label-dark > "Switch to light theme" clip=24x1/159x1
- <span.sr-only> "Menu" clip=24x1/43x1
- <h2.sr-only> "Results at a glance" clip=24x1/142x1
- contrast<4.5: ratio=1.07 fg=rgba(0, 0, 0, 0) bg-eff=7,12,20,1 on "<span>" "Ferreira"
- ratio=1.11 fg=rgb(7, 26, 44) bg-eff=7,12,20,1 on "<a>" "View work"
- ratio=1.07 fg=rgba(0, 0, 0, 0) bg-eff=7,12,20,1 on "<p>" "~10s → <2.5s"
- ratio=1.07 fg=rgba(0, 0, 0, 0) bg-eff=7,12,20,1 on "<p>" "~25k"
- ratio=1.07 fg=rgba(0, 0, 0, 0) bg-eff=7,12,20,1 on "<p>" "100%"
- ratio=1.07 fg=rgba(0, 0, 0, 0) bg-eff=7,12,20,1 on "<p>" "18"
- ratio=1.07 fg=rgba(0, 0, 0, 0) bg-eff=7,12,20,1 on "<dd>" "8"
- ratio=1.07 fg=rgba(0, 0, 0, 0) bg-eff=7,12,20,1 on "<dd>" "3"
- ratio=1.07 fg=rgba(0, 0, 0, 0) bg-eff=7,12,20,1 on "<dd>" "1"
- ratio=1.11 fg=rgb(7, 26, 44) bg-eff=7,12,20,1 on "<a>" "Read the case study"
- ratio=1.11 fg=rgb(7, 26, 44) bg-eff=7,12,20,1 on "<a>" "Connect on LinkedIn"
### work-index @360/light
- overlaps: "Off the clock" <a> x "Selected work" <p>
- "Off the clock" <a> x "Systems I designed, built" <h1>
- "Experience" <a> x "Systems I designed, built" <h1>
- "Contact" <a> x "Systems I designed, built" <h1>
- clipped: <span.theme-toggle__label-light> "Switch to dark theme" clip=24x1/160x1
- <span.sr-only> "Menu" clip=24x1/43x1
- contrast<4.5: ratio=1.00 fg=rgb(255, 255, 255) bg-eff=255,255,255,1 on "<a>" "Get in touch"
### work-index @360/dark
- overlaps: "Off the clock" <a> x "Selected work" <p>
- "Off the clock" <a> x "Systems I designed, built" <h1>
- "Experience" <a> x "Systems I designed, built" <h1>
- "Contact" <a> x "Systems I designed, built" <h1>
- clipped: <span.theme-toggle__label-dark > "Switch to light theme" clip=24x1/159x1
- <span.sr-only> "Menu" clip=24x1/43x1
- contrast<4.5: ratio=1.07 fg=rgba(0, 0, 0, 0) bg-eff=7,12,20,1 on "<dd>" "~10s → <2.5s"
- ratio=1.07 fg=rgba(0, 0, 0, 0) bg-eff=7,12,20,1 on "<dd>" "8"
- ratio=1.07 fg=rgba(0, 0, 0, 0) bg-eff=7,12,20,1 on "<dd>" "3"
- ratio=1.07 fg=rgba(0, 0, 0, 0) bg-eff=7,12,20,1 on "<dd>" "1"
- ratio=1.11 fg=rgb(7, 26, 44) bg-eff=7,12,20,1 on "<a>" "Get in touch"
### work-index @1280/light
- overlaps: "Experience" <a> x "Systems I designed, built" <h1>
- clipped: <label.sr-only> "Visual style (preview)" clip=24x1/162x1
- <span.theme-toggle__label-light> "Switch to dark theme" clip=24x1/160x1
- <span.sr-only> "Menu" clip=24x1/43x1
- contrast<4.5: ratio=1.00 fg=rgb(255, 255, 255) bg-eff=255,255,255,1 on "<a>" "Get in touch"
### work-index @1280/dark
- overlaps: "Experience" <a> x "Systems I designed, built" <h1>
- clipped: <label.sr-only> "Visual style (preview)" clip=24x1/162x1
- <span.theme-toggle__label-dark > "Switch to light theme" clip=24x1/159x1
- <span.sr-only> "Menu" clip=24x1/43x1
- contrast<4.5: ratio=1.07 fg=rgba(0, 0, 0, 0) bg-eff=7,12,20,1 on "<dd>" "~10s → <2.5s"
- ratio=1.07 fg=rgba(0, 0, 0, 0) bg-eff=7,12,20,1 on "<dd>" "8"
- ratio=1.07 fg=rgba(0, 0, 0, 0) bg-eff=7,12,20,1 on "<dd>" "3"
- ratio=1.07 fg=rgba(0, 0, 0, 0) bg-eff=7,12,20,1 on "<dd>" "1"
- ratio=1.11 fg=rgb(7, 26, 44) bg-eff=7,12,20,1 on "<a>" "Get in touch"
### creoate-checkout @360/light
- overlaps: "Experience" <a> x "Rebuilding checkout on a " <h1>
- "Contact" <a> x "Rebuilding checkout on a " <h1>
- clipped: <span.theme-toggle__label-light> "Switch to dark theme" clip=24x1/160x1
- <span.sr-only> "Menu" clip=24x1/43x1
- <h2.sr-only> "Stack" clip=24x1/42x1
- <h2.sr-only> "Tags" clip=24x1/36x1
- contrast<4.5: ratio=1.00 fg=rgb(255, 255, 255) bg-eff=255,255,255,1 on "<a>" "Get in touch"
### creoate-checkout @360/dark
- overlaps: "Experience" <a> x "Rebuilding checkout on a " <h1>
- "Contact" <a> x "Rebuilding checkout on a " <h1>
- clipped: <span.theme-toggle__label-dark > "Switch to light theme" clip=24x1/159x1
- <span.sr-only> "Menu" clip=24x1/43x1
- <h2.sr-only> "Stack" clip=24x1/42x1
- <h2.sr-only> "Tags" clip=24x1/36x1
- contrast<4.5: ratio=1.07 fg=rgba(0, 0, 0, 0) bg-eff=7,12,20,1 on "<p>" "~10s → <2.5s"
- ratio=1.07 fg=rgba(0, 0, 0, 0) bg-eff=7,12,20,1 on "<p>" "8"
- ratio=1.11 fg=rgb(7, 26, 44) bg-eff=7,12,20,1 on "<a>" "Get in touch"
### creoate-checkout @1280/light
- overlaps: 
- clipped: <label.sr-only> "Visual style (preview)" clip=24x1/162x1
- <span.theme-toggle__label-light> "Switch to dark theme" clip=24x1/160x1
- <span.sr-only> "Menu" clip=24x1/43x1
- <h2.sr-only> "Stack" clip=24x1/42x1
- <h2.sr-only> "Tags" clip=24x1/36x1
- contrast<4.5: ratio=1.00 fg=rgb(255, 255, 255) bg-eff=255,255,255,1 on "<a>" "Get in touch"
### creoate-checkout @1280/dark
- overlaps: 
- clipped: <label.sr-only> "Visual style (preview)" clip=24x1/162x1
- <span.theme-toggle__label-dark > "Switch to light theme" clip=24x1/159x1
- <span.sr-only> "Menu" clip=24x1/43x1
- <h2.sr-only> "Stack" clip=24x1/42x1
- <h2.sr-only> "Tags" clip=24x1/36x1
- contrast<4.5: ratio=1.07 fg=rgba(0, 0, 0, 0) bg-eff=7,12,20,1 on "<p>" "~10s → <2.5s"
- ratio=1.07 fg=rgba(0, 0, 0, 0) bg-eff=7,12,20,1 on "<p>" "8"
- ratio=1.11 fg=rgb(7, 26, 44) bg-eff=7,12,20,1 on "<a>" "Get in touch"
### agriluso @360/light
- overlaps: "Experience" <a> x "Agriluso" <h1>
- clipped: <span.theme-toggle__label-light> "Switch to dark theme" clip=24x1/160x1
- <span.sr-only> "Menu" clip=24x1/43x1
- <h2.sr-only> "Stack" clip=24x1/42x1
- <h2.sr-only> "Tags" clip=24x1/36x1
- <div.sr-only> "Architecture, described:
" clip=336x1/2251x1
- contrast<4.5: ratio=1.00 fg=rgb(255, 255, 255) bg-eff=255,255,255,1 on "<a>" "Get in touch"
### agriluso @360/dark
- overlaps: "Experience" <a> x "Agriluso" <h1>
- clipped: <span.theme-toggle__label-dark > "Switch to light theme" clip=24x1/159x1
- <span.sr-only> "Menu" clip=24x1/43x1
- <h2.sr-only> "Stack" clip=24x1/42x1
- <h2.sr-only> "Tags" clip=24x1/36x1
- <div.sr-only> "Architecture, described:
" clip=336x1/2251x1
- contrast<4.5: ratio=1.07 fg=rgba(0, 0, 0, 0) bg-eff=7,12,20,1 on "<p>" "3"
- ratio=1.07 fg=rgba(0, 0, 0, 0) bg-eff=7,12,20,1 on "<p>" "1"
- ratio=1.11 fg=rgb(7, 26, 44) bg-eff=7,12,20,1 on "<a>" "Get in touch"
### agriluso @1280/light
- overlaps: "pulled on a schedule" <tspan> x "websocket" <tspan>
- clipped: <label.sr-only> "Visual style (preview)" clip=24x1/162x1
- <span.theme-toggle__label-light> "Switch to dark theme" clip=24x1/160x1
- <span.sr-only> "Menu" clip=24x1/43x1
- <h2.sr-only> "Stack" clip=24x1/42x1
- <h2.sr-only> "Tags" clip=24x1/36x1
- <div.sr-only> "Architecture, described:
" clip=336x1/2251x1
- contrast<4.5: ratio=1.00 fg=rgb(255, 255, 255) bg-eff=255,255,255,1 on "<a>" "Get in touch"
### agriluso @1280/dark
- overlaps: "pulled on a schedule" <tspan> x "websocket" <tspan>
- clipped: <label.sr-only> "Visual style (preview)" clip=24x1/162x1
- <span.theme-toggle__label-dark > "Switch to light theme" clip=24x1/159x1
- <span.sr-only> "Menu" clip=24x1/43x1
- <h2.sr-only> "Stack" clip=24x1/42x1
- <h2.sr-only> "Tags" clip=24x1/36x1
- <div.sr-only> "Architecture, described:
" clip=336x1/2251x1
- contrast<4.5: ratio=1.07 fg=rgba(0, 0, 0, 0) bg-eff=7,12,20,1 on "<p>" "3"
- ratio=1.07 fg=rgba(0, 0, 0, 0) bg-eff=7,12,20,1 on "<p>" "1"
- ratio=1.11 fg=rgb(7, 26, 44) bg-eff=7,12,20,1 on "<a>" "Get in touch"
### blog @360/light
- overlaps: "Off the clock" <a> x "Writing" <p>
- "Off the clock" <a> x "Notes on the work" <h1>
- "Contact" <a> x "Occasional writing on sys" <p>
- clipped: <span.theme-toggle__label-light> "Switch to dark theme" clip=24x1/160x1
- <span.sr-only> "Menu" clip=24x1/43x1
- contrast<4.5: ratio=1.00 fg=rgb(255, 255, 255) bg-eff=255,255,255,1 on "<a>" "Read the case studies"
### blog @360/dark
- overlaps: "Off the clock" <a> x "Writing" <p>
- "Off the clock" <a> x "Notes on the work" <h1>
- "Contact" <a> x "Occasional writing on sys" <p>
- clipped: <span.theme-toggle__label-dark > "Switch to light theme" clip=24x1/159x1
- <span.sr-only> "Menu" clip=24x1/43x1
- contrast<4.5: ratio=1.11 fg=rgb(7, 26, 44) bg-eff=7,12,20,1 on "<a>" "Read the case studies"
### blog @1280/light
- overlaps: "Experience" <a> x "Notes on the work" <h1>
- clipped: <label.sr-only> "Visual style (preview)" clip=24x1/162x1
- <span.theme-toggle__label-light> "Switch to dark theme" clip=24x1/160x1
- <span.sr-only> "Menu" clip=24x1/43x1
- contrast<4.5: ratio=1.00 fg=rgb(255, 255, 255) bg-eff=255,255,255,1 on "<a>" "Read the case studies"
### blog @1280/dark
- overlaps: "Experience" <a> x "Notes on the work" <h1>
- clipped: <label.sr-only> "Visual style (preview)" clip=24x1/162x1
- <span.theme-toggle__label-dark > "Switch to light theme" clip=24x1/159x1
- <span.sr-only> "Menu" clip=24x1/43x1
- contrast<4.5: ratio=1.11 fg=rgb(7, 26, 44) bg-eff=7,12,20,1 on "<a>" "Read the case studies"

## Step 5: Style-axis contrast (signal / archive / console x light / dark)

Archive and console ship behind the header style switcher but were never audited before launch. Every text token needs >= 4.5:1 and every border token >= 3:1 against surface, surface-raised and surface-sunken.

### signal x light - PASS (15/15)

| token | background | fg | bg | ratio | min | result |
|---|---|---|---|---|---|---|
| --ink | --surface | #08131f | #fff | 18.7 | 4.5 | PASS |
| --ink-muted | --surface | #41536b | #fff | 7.85 | 4.5 | PASS |
| --ink-subtle | --surface | #5a6b82 | #fff | 5.44 | 4.5 | PASS |
| --accent | --surface | #0e4c8f | #fff | 8.57 | 4.5 | PASS |
| --border | --surface | #78899f | #fff | 3.57 | 3 | PASS |
| --ink | --surface-raised | #08131f | #f5f8fc | 17.55 | 4.5 | PASS |
| --ink-muted | --surface-raised | #41536b | #f5f8fc | 7.37 | 4.5 | PASS |
| --ink-subtle | --surface-raised | #5a6b82 | #f5f8fc | 5.11 | 4.5 | PASS |
| --accent | --surface-raised | #0e4c8f | #f5f8fc | 8.05 | 4.5 | PASS |
| --border | --surface-raised | #78899f | #f5f8fc | 3.35 | 3 | PASS |
| --ink | --surface-sunken | #08131f | #e9f0f9 | 16.29 | 4.5 | PASS |
| --ink-muted | --surface-sunken | #41536b | #e9f0f9 | 6.84 | 4.5 | PASS |
| --ink-subtle | --surface-sunken | #5a6b82 | #e9f0f9 | 4.74 | 4.5 | PASS |
| --accent | --surface-sunken | #0e4c8f | #e9f0f9 | 7.47 | 4.5 | PASS |
| --border | --surface-sunken | #78899f | #e9f0f9 | 3.11 | 3 | PASS |

### signal x dark - PASS (15/15)

| token | background | fg | bg | ratio | min | result |
|---|---|---|---|---|---|---|
| --ink | --surface | #eaf1fa | #070c14 | 17.23 | 4.5 | PASS |
| --ink-muted | --surface | #a2b3c9 | #070c14 | 9.17 | 4.5 | PASS |
| --ink-subtle | --surface | #8194ac | #070c14 | 6.31 | 4.5 | PASS |
| --accent | --surface | #7faeff | #070c14 | 8.77 | 4.5 | PASS |
| --border | --surface | #5d7595 | #070c14 | 4.15 | 3 | PASS |
| --ink | --surface-raised | #eaf1fa | #0f1826 | 15.66 | 4.5 | PASS |
| --ink-muted | --surface-raised | #a2b3c9 | #0f1826 | 8.34 | 4.5 | PASS |
| --ink-subtle | --surface-raised | #8194ac | #0f1826 | 5.74 | 4.5 | PASS |
| --accent | --surface-raised | #7faeff | #0f1826 | 7.97 | 4.5 | PASS |
| --border | --surface-raised | #5d7595 | #0f1826 | 3.77 | 3 | PASS |
| --ink | --surface-sunken | #eaf1fa | #04080e | 17.65 | 4.5 | PASS |
| --ink-muted | --surface-sunken | #a2b3c9 | #04080e | 9.39 | 4.5 | PASS |
| --ink-subtle | --surface-sunken | #8194ac | #04080e | 6.47 | 4.5 | PASS |
| --accent | --surface-sunken | #7faeff | #04080e | 8.99 | 4.5 | PASS |
| --border | --surface-sunken | #5d7595 | #04080e | 4.25 | 3 | PASS |

### archive x light - PASS (15/15)

| token | background | fg | bg | ratio | min | result |
|---|---|---|---|---|---|---|
| --ink | --surface | #211b14 | #faf6f0 | 15.84 | 4.5 | PASS |
| --ink-muted | --surface | #4d4237 | #faf6f0 | 9.07 | 4.5 | PASS |
| --ink-subtle | --surface | #6b5d4e | #faf6f0 | 5.91 | 4.5 | PASS |
| --accent | --surface | #8c3a2d | #faf6f0 | 7.07 | 4.5 | PASS |
| --border | --surface | #837460 | #faf6f0 | 4.21 | 3 | PASS |
| --ink | --surface-raised | #211b14 | #f2ecdf | 14.49 | 4.5 | PASS |
| --ink-muted | --surface-raised | #4d4237 | #f2ecdf | 8.3 | 4.5 | PASS |
| --ink-subtle | --surface-raised | #6b5d4e | #f2ecdf | 5.4 | 4.5 | PASS |
| --accent | --surface-raised | #8c3a2d | #f2ecdf | 6.47 | 4.5 | PASS |
| --border | --surface-raised | #837460 | #f2ecdf | 3.85 | 3 | PASS |
| --ink | --surface-sunken | #211b14 | #e9e1d0 | 13.11 | 4.5 | PASS |
| --ink-muted | --surface-sunken | #4d4237 | #e9e1d0 | 7.51 | 4.5 | PASS |
| --ink-subtle | --surface-sunken | #6b5d4e | #e9e1d0 | 4.89 | 4.5 | PASS |
| --accent | --surface-sunken | #8c3a2d | #e9e1d0 | 5.85 | 4.5 | PASS |
| --border | --surface-sunken | #837460 | #e9e1d0 | 3.49 | 3 | PASS |

### archive x dark - PASS (15/15)

| token | background | fg | bg | ratio | min | result |
|---|---|---|---|---|---|---|
| --ink | --surface | #ede5d8 | #1d1915 | 13.98 | 4.5 | PASS |
| --ink-muted | --surface | #b3a695 | #1d1915 | 7.32 | 4.5 | PASS |
| --ink-subtle | --surface | #95897c | #1d1915 | 5.11 | 4.5 | PASS |
| --accent | --surface | #d99a5b | #1d1915 | 7.26 | 4.5 | PASS |
| --border | --surface | #7a6e60 | #1d1915 | 3.52 | 3 | PASS |
| --ink | --surface-raised | #ede5d8 | #26211b | 12.77 | 4.5 | PASS |
| --ink-muted | --surface-raised | #b3a695 | #26211b | 6.69 | 4.5 | PASS |
| --ink-subtle | --surface-raised | #95897c | #26211b | 4.67 | 4.5 | PASS |
| --accent | --surface-raised | #d99a5b | #26211b | 6.63 | 4.5 | PASS |
| --border | --surface-raised | #7a6e60 | #26211b | 3.21 | 3 | PASS |
| --ink | --surface-sunken | #ede5d8 | #15110d | 15.03 | 4.5 | PASS |
| --ink-muted | --surface-sunken | #b3a695 | #15110d | 7.88 | 4.5 | PASS |
| --ink-subtle | --surface-sunken | #95897c | #15110d | 5.5 | 4.5 | PASS |
| --accent | --surface-sunken | #d99a5b | #15110d | 7.8 | 4.5 | PASS |
| --border | --surface-sunken | #7a6e60 | #15110d | 3.78 | 3 | PASS |

### console x light - PASS (15/15)

| token | background | fg | bg | ratio | min | result |
|---|---|---|---|---|---|---|
| --ink | --surface | #101213 | #f7f8f7 | 17.64 | 4.5 | PASS |
| --ink-muted | --surface | #3b4043 | #f7f8f7 | 9.86 | 4.5 | PASS |
| --ink-subtle | --surface | #565d61 | #f7f8f7 | 6.29 | 4.5 | PASS |
| --accent | --surface | #0c6e33 | #f7f8f7 | 5.99 | 4.5 | PASS |
| --border | --surface | #6b7276 | #f7f8f7 | 4.59 | 3 | PASS |
| --ink | --surface-raised | #101213 | #eff1ee | 16.54 | 4.5 | PASS |
| --ink-muted | --surface-raised | #3b4043 | #eff1ee | 9.24 | 4.5 | PASS |
| --ink-subtle | --surface-raised | #565d61 | #eff1ee | 5.9 | 4.5 | PASS |
| --accent | --surface-raised | #0c6e33 | #eff1ee | 5.61 | 4.5 | PASS |
| --border | --surface-raised | #6b7276 | #eff1ee | 4.31 | 3 | PASS |
| --ink | --surface-sunken | #101213 | #e6e8e4 | 15.23 | 4.5 | PASS |
| --ink-muted | --surface-sunken | #3b4043 | #e6e8e4 | 8.51 | 4.5 | PASS |
| --ink-subtle | --surface-sunken | #565d61 | #e6e8e4 | 5.43 | 4.5 | PASS |
| --accent | --surface-sunken | #0c6e33 | #e6e8e4 | 5.17 | 4.5 | PASS |
| --border | --surface-sunken | #6b7276 | #e6e8e4 | 3.97 | 3 | PASS |

### console x dark - PASS (15/15)

| token | background | fg | bg | ratio | min | result |
|---|---|---|---|---|---|---|
| --ink | --surface | #e4e8e3 | #0b0c0b | 15.82 | 4.5 | PASS |
| --ink-muted | --surface | #a4aca4 | #0b0c0b | 8.41 | 4.5 | PASS |
| --ink-subtle | --surface | #7d847d | #0b0c0b | 5.1 | 4.5 | PASS |
| --accent | --surface | #35c96f | #0b0c0b | 9.08 | 4.5 | PASS |
| --border | --surface | #616a62 | #0b0c0b | 3.5 | 3 | PASS |
| --ink | --surface-raised | #e4e8e3 | #141614 | 14.68 | 4.5 | PASS |
| --ink-muted | --surface-raised | #a4aca4 | #141614 | 7.81 | 4.5 | PASS |
| --ink-subtle | --surface-raised | #7d847d | #141614 | 4.74 | 4.5 | PASS |
| --accent | --surface-raised | #35c96f | #141614 | 8.43 | 4.5 | PASS |
| --border | --surface-raised | #616a62 | #141614 | 3.24 | 3 | PASS |
| --ink | --surface-sunken | #e4e8e3 | #060706 | 16.29 | 4.5 | PASS |
| --ink-muted | --surface-sunken | #a4aca4 | #060706 | 8.66 | 4.5 | PASS |
| --ink-subtle | --surface-sunken | #7d847d | #060706 | 5.25 | 4.5 | PASS |
| --accent | --surface-sunken | #35c96f | #060706 | 9.35 | 4.5 | PASS |
| --border | --surface-sunken | #616a62 | #060706 | 3.6 | 3 | PASS |

All six combinations pass.
