import { chromium } from 'playwright';
import { appendFileSync } from 'node:fs';

const BASE = 'http://localhost:4331';
const REPORT = new URL('../REPORT.md', import.meta.url);
const ROUTES = [
  ['home', '/'],
  ['work-index', '/work/'],
  ['creoate-checkout', '/work/creoate-checkout/'],
  ['agriluso', '/work/agriluso/'],
  ['blog', '/blog/'],
];
const CASES = [[360, 'light'], [360, 'dark'], [1280, 'light'], [1280, 'dark']];
const browser = await chromium.launch();
const findings = [];

const SCAN = () => {
  const out = { overlaps: [], clipped: [], contrast: [] };
  const visible = (el) => {
    if (el.getClientRects().length === 0) return false;
    const cs = getComputedStyle(el);
    return cs.visibility !== 'hidden' && cs.display !== 'none' && parseFloat(cs.opacity) > 0.01;
  };
  // leaf nodes with direct text
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const textEls = [];
  while (walker.nextNode()) {
    const t = walker.currentNode;
    if (!t.nodeValue.trim()) continue;
    const el = t.parentElement;
    if (!el || !visible(el)) continue;
    // skip if an ancestor already captured this exact text (dedupe by rect+text)
    textEls.push({ el, text: t.nodeValue.trim().slice(0, 25), r: el.getBoundingClientRect() });
  }
  // overlaps: pair intersections
  for (let i = 0; i < textEls.length; i++) {
    for (let j = i + 1; j < textEls.length; j++) {
      const a = textEls[i], b = textEls[j];
      if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
      if (a.text === b.text) continue;
      const x = Math.max(a.r.left, b.r.left), y = Math.max(a.r.top, b.r.top);
      const x2 = Math.min(a.r.right, b.r.right), y2 = Math.min(a.r.bottom, b.r.bottom);
      const inter = Math.max(0, x2 - x) * Math.max(0, y2 - y);
      const small = Math.min(a.r.width * a.r.height, b.r.width * b.r.height);
      if (inter > 0.35 * small && small > 80 && a.r.width > 20 && b.r.width > 20) {
        out.overlaps.push(`"${a.text}" <${a.el.tagName.toLowerCase()}> x "${b.text}" <${b.el.tagName.toLowerCase()}>`);
      }
    }
  }
  // clipped: text-bearing element whose own box clips its content
  for (const el of document.querySelectorAll('body *')) {
    if (!visible(el) || !el.innerText?.trim()) continue;
    const cs = getComputedStyle(el);
    if (!/hidden|auto|clip/.test(cs.overflow + cs.overflowX + cs.overflowY)) continue;
    if (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1) {
      out.clipped.push(`<${el.tagName.toLowerCase()}${el.className ? '.' + String(el.className).slice(0, 25) : ''}> "${(el.innerText || '').trim().slice(0, 25)}" clip=${el.scrollHeight}x${el.clientHeight}/${el.scrollWidth}x${el.clientWidth}`);
    }
  }
  // contrast: text color vs effective ancestor background
  const parse = (c) => c.match(/[\d.]+/g).map(Number);
  const rgba = (c) => { const [r, g, b, a] = parse(c); return [r, g, b, a === undefined ? 1 : a]; };
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const over = (top, bot) => {
    const [tr, tg, tb, ta] = top;
    const br = ta * tr + (1 - ta) * bot[0], bg = ta * tg + (1 - ta) * bot[1], bb = ta * tb + (1 - ta) * bot[2];
    return [br, bg, bb, 1];
  };
  const seen = new Set();
  for (const { el } of textEls) {
    const cs = getComputedStyle(el);
    const fg = rgba(cs.color);
    let bg = [255, 255, 255, 1];
    for (let n = el; n && n instanceof Element; n = n.parentElement) {
      const b = getComputedStyle(n).backgroundColor;
      const p = parse(b);
      if (p.length === 3 || (p.length >= 4 && p[3] > 0)) bg = over(rgba(b), bg);
    }
    const key = cs.color + '|' + bg.map(Math.round).join() + '|' + (el.textContent || '').trim().slice(0, 15);
    if (seen.has(key)) continue; seen.add(key);
    const L1 = Math.max(lum(fg), lum(bg)), L2 = Math.min(lum(fg), lum(bg));
    const ratio = (L1 + 0.05) / (L2 + 0.05);
    if (ratio < 4.5) out.contrast.push(`ratio=${ratio.toFixed(2)} fg=${cs.color} bg-eff=${bg.map(Math.round).join(',')} on "<${el.tagName.toLowerCase()}>" "${(el.textContent || '').trim().slice(0, 25)}"`);
  }
  out.overlaps = [...new Set(out.overlaps)].slice(0, 15);
  out.clipped = out.clipped.slice(0, 15);
  out.contrast = out.contrast.slice(0, 15);
  return out;
};

for (const [slug, route] of ROUTES) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  for (const [w, theme] of CASES) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.goto(BASE + route, { waitUntil: 'networkidle' });
    await page.evaluate((t) => { document.documentElement.dataset.theme = t; }, theme);
    await page.waitForTimeout(250);
    const r = await page.evaluate(SCAN);
    const bad = r.overlaps.length + r.clipped.length + r.contrast.length;
    if (bad) findings.push(`### ${slug} @${w}/${theme}\n- overlaps: ${(r.overlaps || ['- none -']).join('\n- ')}\n- clipped: ${(r.clipped || ['- none -']).join('\n- ')}\n- contrast<4.5: ${(r.contrast || ['- none -']).join('\n- ')}`);
    else findings.push(`### ${slug} @${w}/${theme}\n- checked, no defects (no text overlap, no clipped text containers, all text ≥ 4.5:1)`);
  }
  await ctx.close();
}
await browser.close();

const anyBad = findings.some(f => f.includes('DEFECT') ? true : /- overlaps: (?!- none -)|- clipped: (?!- none -)|- contrast<4.5: (?!- none -)/.test(f));
appendFileSync(REPORT, '\n## Step 4: Screenshots & visual defects\n\n20 full-page PNGs saved to `audit/screenshots/` (5 routes × 360/1280 × light/dark, fullPage, deviceScaleFactor 1).\n\nCOULD NOT RUN: pixel-level visual inspection by this worker - the active model in this session does not support image input (`read` on the PNGs returned "model does not support images"). Instead, each of the 20 rendered pages was inspected programmatically (same 4 conditions): text-on-text overlap (bounding-box intersection of visible text nodes, < 4.5:1 contrast, and text containers clipped by overflow-hidden). Findings:\n\n' + findings.join('\n') + (anyBad ? '' : '\n\nAll 20 screens: no overlapping text, no clipped content, no text below 4.5:1 contrast.') + '\n');
console.log(anyBad ? 'FINDINGS PRESENT - see REPORT.md step 4' : 'ALL 20 CLEAN');
