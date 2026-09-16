/**
 * Tiny string builders for the hand-authored architecture diagrams.
 *
 * Everything paints through `style="…: var(--token)"` rather than presentation
 * attributes, because presentation attributes do not resolve `var()` reliably —
 * this is what makes the diagrams follow the light/dark theme instead of
 * baking in a hex that only works on one background.
 *
 * The output is injected with `set:html` inside an `<svg>`, so it is parsed in
 * the SVG namespace.
 */

export type Tone = 'plain' | 'accent' | 'signal' | 'ghost';

const FILL: Record<Tone, string> = {
  plain: 'var(--surface-raised)',
  accent: 'var(--accent-soft)',
  signal: 'var(--signal-soft)',
  ghost: 'transparent',
};

const STROKE: Record<Tone, string> = {
  plain: 'var(--border)',
  accent: 'var(--accent)',
  signal: 'var(--signal)',
  ghost: 'var(--border)',
};

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export interface BoxSpec {
  x: number;
  y: number;
  w: number;
  h: number;
  /** One string, or one string per line. */
  title: string | string[];
  /** Smaller supporting line under the title. */
  sub?: string | string[];
  tone?: Tone;
  dashed?: boolean;
  /** Title size; sub is always 2px smaller than the default title. */
  size?: number;
}

/** A labelled rounded box. Text is centred on the box, one `<tspan>` per line. */
export function box(spec: BoxSpec): string {
  const { x, y, w, h, tone = 'plain', dashed = false, size = 13 } = spec;
  const titles = Array.isArray(spec.title) ? spec.title : [spec.title];
  const subs = spec.sub === undefined ? [] : Array.isArray(spec.sub) ? spec.sub : [spec.sub];
  const cx = x + w / 2;

  const titleLead = size + 3;
  const subSize = 11;
  const subLead = subSize + 2.5;
  const blockHeight = titles.length * titleLead + (subs.length ? subs.length * subLead + 3 : 0);
  let cursor = y + h / 2 - blockHeight / 2 + size;

  let text = '';
  for (const line of titles) {
    text += `<tspan x="${cx}" y="${cursor.toFixed(1)}">${esc(line)}</tspan>`;
    cursor += titleLead;
  }
  const titleEl = `<text style="fill:var(--ink);font-size:${size}px;font-weight:700" text-anchor="middle">${text}</text>`;

  let subEl = '';
  if (subs.length) {
    cursor += 1;
    let subText = '';
    for (const line of subs) {
      subText += `<tspan x="${cx}" y="${cursor.toFixed(1)}">${esc(line)}</tspan>`;
      cursor += subLead;
    }
    subEl = `<text style="fill:var(--ink-muted);font-size:${subSize}px" text-anchor="middle">${subText}</text>`;
  }

  return (
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" ` +
    `style="fill:${FILL[tone]};stroke:${STROKE[tone]};stroke-width:1.5${dashed ? ';stroke-dasharray:5 4' : ''}"/>` +
    titleEl +
    subEl
  );
}

export interface EdgeOpts {
  /** Unique marker namespace for the SVG this edge belongs to. */
  ns: string;
  dashed?: boolean;
  /** Arrowhead at the start as well as the end. */
  both?: boolean;
  /** Muted (dotted observability) line. */
  faint?: boolean;
}

/** An arrow along an explicit path. */
export function edge(d: string, opts: EdgeOpts): string {
  const { ns, dashed = false, both = false, faint = false } = opts;
  const color = faint ? 'var(--ink-subtle)' : 'var(--ink-muted)';
  const dash = dashed ? ';stroke-dasharray:5 4' : faint ? ';stroke-dasharray:2 4' : '';
  const start = both ? ` marker-start="url(#${ns}-head-back)"` : '';
  return (
    `<path d="${d}" fill="none"${start} marker-end="url(#${ns}-head)" ` +
    `style="stroke:${color};stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round${dash}"/>`
  );
}

export interface TextOpts {
  anchor?: 'start' | 'middle' | 'end';
  size?: number;
  weight?: number;
  color?: string;
  /** Extra lines below the first, at `size + 2` leading. */
  lines?: string[];
  uppercase?: boolean;
}

/** A free-standing caption inside the drawing. */
export function note(x: number, y: number, text: string, opts: TextOpts = {}): string {
  const {
    anchor = 'start',
    size = 11,
    weight = 500,
    color = 'var(--ink-subtle)',
    lines = [],
    uppercase = false,
  } = opts;
  const all = [text, ...lines];
  const spans = all
    .map((line, i) => `<tspan x="${x}" y="${(y + i * (size + 2.5)).toFixed(1)}">${esc(line)}</tspan>`)
    .join('');
  return (
    `<text text-anchor="${anchor}" style="fill:${color};font-size:${size}px;font-weight:${weight}` +
    `${uppercase ? ';letter-spacing:0.09em;text-transform:uppercase' : ''}">${spans}</text>`
  );
}

/** The "retries with backoff" loop drawn on top of a queue box. */
export function retryLoop(cx: number, topY: number, ns: string, r = 15): string {
  const d = `M ${cx - r} ${topY} C ${cx - r} ${topY - r * 1.5} ${cx + r} ${topY - r * 1.5} ${cx + r} ${topY - 2}`;
  return edge(d, { ns });
}

/** Arrowhead markers. One `<defs>` per SVG, namespaced so ids stay unique. */
export function defs(ns: string): string {
  const head = (id: string, path: string) =>
    `<marker id="${id}" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" ` +
    `orient="auto-start-reverse"><path d="${path}" style="fill:var(--ink-muted)"/></marker>`;
  return (
    `<defs>${head(`${ns}-head`, 'M0 0 L10 5 L0 10 z')}` +
    `${head(`${ns}-head-back`, 'M0 0 L10 5 L0 10 z')}</defs>`
  );
}
