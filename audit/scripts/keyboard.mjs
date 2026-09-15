import { chromium } from 'playwright';
import { appendFileSync } from 'node:fs';

const BASE = 'http://localhost:4331';
const ROUTES = [['home', '/'], ['creoate-checkout', '/work/creoate-checkout/']];
const REPORT = new URL('../REPORT.md', import.meta.url);
const out = [];
const browser = await chromium.launch();

for (const [slug, route] of ROUTES) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + route, { waitUntil: 'networkidle' });

  // Tab order (max 40 stops; stop when focus cycles back to body or repeats)
  const stops = [];
  let firstSkip = true;
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const cs = getComputedStyle(el);
      const ring = `${cs.outlineWidth} ${cs.outlineStyle} ${cs.outlineColor} / boxShadow: ${cs.boxShadow}`;
      let name = el.getAttribute('aria-label') || '';
      if (!name) {
        for (const child of el.querySelectorAll('.sr-only')) name += child.textContent.trim();
      }
      if (!name && el.tagName === 'BUTTON' && !el.textContent.trim().replace(/\s+/g, ' ')) name = '(icon only)';
      name = (el.textContent.trim().replace(/\s+/g, ' ') || name).slice(0, 40) || name;
      return { tag: el.tagName.toLowerCase(), id: el.id || '', class: [...el.classList].join(' ').slice(0, 30), name: name.slice(0, 40), ring };
    });
    if (!info) { stops.push(`stop ${i + 1}: <body> (cycle or unfocusable)`); break; }
    if (firstSkip) {
      stops.push(`stop ${i + 1}: SKIP-LINK-POSITION is-${/skip-link/.test(info.class)}`);
      firstSkip = false;
    }
    stops.push(`stop ${i + 1}: <${info.tag}${info.id ? '#' + info.id : ''}.${info.class}> name="${info.name}" ring: ${info.ring}`);
  }
  out.push(`### ${slug} (${route}) — tab order (1280px)\n\n${stops.map(s => '- ' + s).join('\n')}`);

  // Skip link activation: does focus move into <main>?
  const skip = await page.evaluate(async () => {
    const link = document.querySelector('.skip-link');
    if (!link) return 'NO SKIP LINK';
    link.focus();
    const before = document.activeElement === link;
    // simulate activation (Enter)
    link.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    link.click();
    await new Promise(r => setTimeout(r, 50));
    const ae = document.activeElement;
    const inMain = !!(ae && (ae.id === 'main' || document.querySelector('#main')?.contains(ae))) && ae !== document.body;
    return JSON.stringify({ focusedFirst: before, activeAfter: ae.tagName + '#' + ae.id, focusInMain: inMain });
  });
  out.push(`Skip link activation on ${slug}: ${skip}`);

  // Theme toggle accessible name in both states
  const names = [];
  for (const theme of ['light', 'dark']) {
    await page.evaluate((t) => { document.documentElement.dataset.theme = t; }, theme);
    const n = await page.evaluate(() => {
      const btn = document.querySelector('[data-theme-toggle]');
      if (!btn) return 'NO TOGGLE';
      // accessible name = visible text content (display:none children excluded by browser)
      const visible = [...btn.querySelectorAll('span')].filter(s => getComputedStyle(s).display !== 'none').map(s => s.textContent.trim()).join(' ');
      return visible || '(none)';
    });
    names.push(`${theme}: "${n}"`);
  }
  out.push(`Theme toggle accessible name on ${slug} — ${names.join(' | ')}`);
  await ctx.close();
}

// Mobile nav at 360px: keyboard open/close on <details>/<summary>
{
  const ctx = await browser.newContext({ viewport: { width: 360, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  const res = [];
  const before = await page.evaluate(() => document.querySelector('.site-nav')?.open);
  res.push(`initial open: ${before}`);
  await page.evaluate(() => document.querySelector('.site-nav summary').focus());
  await page.keyboard.press('Enter');
  const opened = await page.evaluate(() => document.querySelector('.site-nav')?.open);
  res.push(`after Enter on summary: open=${opened}`);
  // tab into the menu? check first tab stop after opening
  await page.keyboard.press('Tab');
  const first = await page.evaluate(() => {
    const ae = document.activeElement;
    return ae.tagName + '.' + [...ae.classList].join('.').slice(0, 30) + ' inMenu=' + !!document.querySelector('.site-nav')?.contains(ae);
  });
  res.push(`first tab stop after open: ${first}`);
  await page.evaluate(() => document.querySelector('.site-nav summary').focus());
  await page.keyboard.press('Enter');
  const closed = await page.evaluate(() => document.querySelector('.site-nav')?.open);
  res.push(`after Enter again: open=${closed}`);
  out.push(`Mobile nav at 360px: ${res.join(' | ')}`);
  await ctx.close();
}

await browser.close();
appendFileSync(REPORT, '\n## Step 2: Keyboard & focus\n\n' + out.join('\n\n') + '\n');
console.log(out.join('\n---\n'));
