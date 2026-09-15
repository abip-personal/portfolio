import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = 'http://localhost:4331';
const OUT = new URL('../screenshots', import.meta.url);
mkdirSync(OUT, { recursive: true });
const ROUTES = [
  ['home', '/'],
  ['work-index', '/work/'],
  ['creoate-checkout', '/work/creoate-checkout/'],
  ['agriluso', '/work/agriluso/'],
  ['blog', '/blog/'],
];
const WIDTHS = [360, 1280];
const THEMES = ['light', 'dark'];
const browser = await chromium.launch();
for (const [slug, route] of ROUTES) {
  const ctx = await browser.newContext({ viewport: { width: 360, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 2000 });
    for (const theme of THEMES) {
      await page.goto(BASE + route, { waitUntil: 'networkidle' });
      await page.evaluate((t) => { document.documentElement.dataset.theme = t; }, theme);
      await page.waitForTimeout(250);
      await page.screenshot({ path: `file://${OUT}${slug}-${width}-${theme}.png`, fullPage: true });
    }
  }
  await ctx.close();
}
await browser.close();
console.log('saved 20 screenshots');
