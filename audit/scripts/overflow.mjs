import { chromium } from 'playwright';
import { appendFileSync, existsSync, writeFileSync } from 'node:fs';

const BASE = 'http://localhost:4331';
const ROUTES = [
  ['home', '/'],
  ['work-index', '/work/'],
  ['creoate-checkout', '/work/creoate-checkout/'],
  ['agriluso', '/work/agriluso/'],
  ['blog', '/blog/'],
];
const WIDTHS = [360, 768, 1280, 1920];
const THEMES = ['light', 'dark'];
const REPORT = new URL('../REPORT.md', import.meta.url);

let report = '';
if (existsSync(REPORT)) {
  const { readFileSync } = await import('node:fs');
  report = readFileSync(REPORT, 'utf8');
  const marker = '## Step 1: Horizontal overflow';
  const i = report.indexOf(marker);
  if (i !== -1) {
    const end = report.indexOf('\n## ', i + marker.length);
    report = (report.slice(0, i) + (end === -1 ? '' : report.slice(end))).trimEnd() + '\n\n';
  }
}

const rows = [];
const offenders = [];
const browser = await chromium.launch();

for (const [slug, route] of ROUTES) {
  const ctx = await browser.newContext({ viewport: { width: WIDTHS[0], height: 900 } });
  const page = await ctx.newPage();
  for (const width of WIDTHS) {
    for (const theme of THEMES) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(BASE + route, { waitUntil: 'networkidle' });
      await page.evaluate((t) => { document.documentElement.dataset.theme = t; }, theme);
      await page.waitForTimeout(200);
      const [scrollWidth, innerWidth] = await page.evaluate(() => {
        void document.body.offsetHeight;
        return [document.documentElement.scrollWidth, window.innerWidth];
      });
      const status = scrollWidth > innerWidth ? 'OVERFLOW' : 'OK';
      rows.push(`| ${slug} | ${width} | ${theme} | ${scrollWidth} | ${innerWidth} | ${status} |`);
      if (status === 'OVERFLOW') {
        const off = await page.evaluate((iw) => {
          const out = [];
          for (const el of document.querySelectorAll('*')) {
            const r = el.getBoundingClientRect();
            if (r.width > 0 && r.right > iw + 1) {
              out.push(`${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}.${[...el.classList].join('.')} right=${Math.round(r.right)} w=${Math.round(r.width)}`);
            }
          }
          return out.slice(0, 12);
        }, innerWidth);
        offenders.push({ slug, route, width, theme, off });
      }
    }
  }
  await ctx.close();
}
await browser.close();

const table = [
  '## Step 1: Horizontal overflow',
  '',
  'Measured with headless Chromium via Playwright against `npx astro preview` on :4331, after setting `document.documentElement.dataset.theme`.',
  '',
  '| route | width | theme | scrollWidth | innerWidth | status |',
  '|---|---|---|---|---|---|',
  ...rows,
  '',
  offenders.length
    ? `OFFENDER ELEMENTS:\n\n${offenders.map(o => `- ${o.slug} @${o.width}/${o.theme}: ${o.off.join('; ')}`).join('\n')}`
    : 'No overflow detected on any route/width/theme combination.',
  '',
];
if (report) appendFileSync(REPORT, '\n' + table.join('\n') + '\n');
else writeFileSync(REPORT, '# Accessibility + responsive audit\n\n' + table.join('\n') + '\n');

const bad = rows.filter(r => r.includes('OVERFLOW')).length;
console.log(`done: ${rows.length} measurements, ${bad} overflow`);
for (const o of offenders) console.log(`OVERFLOW ${o.slug}@${o.width}/${o.theme}: ${o.off.slice(0,6).join(' | ')}`);
