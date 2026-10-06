#!/usr/bin/env node
/**
 * Deterministic WCAG contrast gate for the Nhà Mai token layer.
 *
 * Parses `:root` and every `[data-theme='…']` block in src/styles/global.css,
 * resolves the selector-level color pairs from docs/design-language.md
 * (§3.3 accessibility contract, §3.4 audit table) for EACH theme — rest AND
 * hover states — and fails (exit 1) below the doc's thresholds:
 *
 *   - 4.5:1 for every text pair (text, muted, links, button inks, accent
 *     text roles, badge inks, price)
 *   - 3:1  for the :focus-visible ring (non-text minimum), audited against
 *     BOTH --bg and --surface per theme
 *
 * The pair list mirrors the rendered selectors, not bare tokens, so a
 * hover-state or per-theme regression cannot pass silently. Adding a theme
 * block to global.css automatically extends the audit to it.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const repoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const cssPath = path.join(repoRoot, 'src', 'styles', 'global.css');
const css = readFileSync(cssPath, 'utf8');

/* ---------- CSS parsing: token blocks ---------- */

function parseDeclarations(block) {
  const map = {};
  for (const m of block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    map[m[1].trim()] = m[2].trim();
  }
  return map;
}

function parseThemes(source) {
  const themes = new Map();
  let base = {};
  // Strip comments first: token DOCUMENTATION often contains pseudo-selector
  // text like "--accent:hover …" that would otherwise be parsed as (and
  // swallow) real declarations.
  const noComments = source.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of noComments.matchAll(/:root\s*\{([^}]*)\}/g)) {
    base = { ...base, ...parseDeclarations(m[1]) };
  }
  if (Object.keys(base).length === 0) {
    fail(`no :root token block found in ${cssPath}`);
  }
  themes.set('base', base);
  for (const m of noComments.matchAll(/\[data-theme=['"]([\w-]+)['"]\]\s*\{([^}]*)\}/g)) {
    const [, id, block] = m;
    themes.set(id, { ...base, ...parseDeclarations(block) });
  }
  return themes;
}

/* ---------- WCAG 2.x relative luminance ---------- */

const HEX = /^#([0-9a-f]{6})$/i;

function luminance(hex) {
  const m = HEX.exec(hex);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(fg, bg) {
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  if (l1 === null || l2 === null) return null;
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/* ---------- selector-level pair contract (docs §3.3 / §3.4) ---------- */
/* fg/bg are token names, or literal hex (prefixed with #). min = threshold. */
const PAIRS = [
  { name: 'body text on page bg', fg: '--text', bg: '--bg', min: 4.5 },
  { name: 'body text on cards', fg: '--text', bg: '--surface', min: 4.5 },
  { name: 'muted text on page bg', fg: '--muted', bg: '--bg', min: 4.5 },
  { name: 'muted text on cards', fg: '--muted', bg: '--surface', min: 4.5 },
  { name: 'link rest on page bg', fg: '--primary', bg: '--bg', min: 4.5 },
  { name: 'link rest on cards', fg: '--primary', bg: '--surface', min: 4.5 },
  { name: '.btn--primary rest (ink on fill)', fg: '--primary-ink', bg: '--primary', min: 4.5 },
  { name: '.btn--primary hover (ink on fill)', fg: '--primary-ink', bg: '--primary-deep', min: 4.5 },
  { name: '.eyebrow (accent-strong text on bg)', fg: '--accent-strong', bg: '--bg', min: 4.5 },
  { name: '.link-more/.card-zalo (accent-strong on surface)', fg: '--accent-strong', bg: '--surface', min: 4.5 },
  { name: 'a:hover/.chip:hover (accent-deep on bg)', fg: '--accent-deep', bg: '--bg', min: 4.5 },
  { name: 'a:hover on cards (accent-deep on surface)', fg: '--accent-deep', bg: '--surface', min: 4.5 },
  { name: '.btn--accent rest (ink on fill)', fg: '--accent-ink', bg: '--accent-fill', min: 4.5 },
  { name: '.btn--accent hover (ink on fill-hover)', fg: '--accent-ink', bg: '--accent-fill-hover', min: 4.5 },
  { name: '.badge--bulk (gold-ink on gold)', fg: '--gold-ink', bg: '--gold', min: 4.5 },
  { name: '.badge--hot (white on tet, all themes)', fg: '#ffffff', bg: '--tet', min: 4.5 },
  { name: '.price in tet theme (tet on bg, all themes)', fg: '--tet', bg: '--bg', min: 4.5 },
  { name: ':focus-visible ring vs bg (non-text)', fg: '--primary', bg: '--bg', min: 3.0 },
  { name: ':focus-visible ring vs surface (non-text)', fg: '--primary', bg: '--surface', min: 3.0 },
  /* .cta-band is filled with --primary, so the ring there is the ink
     override (§3.3 dark-panel exception) — audited against the fill. */
  { name: ':focus-visible ring on .cta-band (ink on primary fill)', fg: '--primary-ink', bg: '--primary', min: 3.0 },
];

/* ---------- run ---------- */

function fail(message) {
  console.error(`check-contrast: ${message}`);
  process.exit(1);
}

const themes = parseThemes(css);
const rows = [];
const failures = [];

for (const [theme, tokens] of themes) {
  for (const pair of PAIRS) {
    const resolve = (v) => (v.startsWith('#') ? v : tokens[v]);
    const fgRaw = resolve(pair.fg);
    const bgRaw = resolve(pair.bg);
    if (fgRaw === undefined) fail(`theme '${theme}': token ${pair.fg} not found for pair '${pair.name}'`);
    if (bgRaw === undefined) fail(`theme '${theme}': token ${pair.bg} not found for pair '${pair.name}'`);
    const fgHex = HEX.exec(fgRaw)?.[0] ?? null;
    const bgHex = HEX.exec(bgRaw)?.[0] ?? null;
    if (!fgHex || !bgHex) {
      fail(`theme '${theme}': pair '${pair.name}' has a non-hex value (${pair.fg}=${fgRaw}, ${pair.bg}=${bgRaw})`);
    }
    const ratio = contrast(fgHex, bgHex);
    const ok = ratio >= pair.min;
    rows.push({ theme, pair, fg: fgHex, bg: bgHex, ratio, ok });
    if (!ok) failures.push(rows[rows.length - 1]);
  }
}

for (const r of rows) {
  const line =
    `${r.theme.padEnd(11)} ${String(r.pair.min.toFixed(1)).padStart(4)}:1  ` +
    `${(r.ratio.toFixed(2) + ':1').padStart(8)}  ${r.fg} on ${r.bg}  ${r.ok ? 'PASS' : 'FAIL'}`;
  console.log(line);
}

/* Structural ring assertions (§3.3). Token pairs cannot see WHICH selector
   renders: .cta-band is filled with --primary, so without the ink override
   its ring would be primary-on-primary (1.00:1) while every token pair
   still passes. Assert the rendered rules exist. */
const noCommentsCss = css.replace(/\/\*[\s\S]*?\*\//g, '');
const structuralRules = [
  {
    name: 'default :focus-visible ring sources its color from --primary',
    present: /:focus-visible\s*\{[^}]*outline:\s*3px\s+solid\s+var\(--primary\)/.test(noCommentsCss),
  },
  {
    name: '.cta-band :focus-visible overrides the ring to --primary-ink (dark-panel exception)',
    present: /\.cta-band\s+:focus-visible\s*\{[^}]*outline-color:\s*var\(--primary-ink\)/.test(noCommentsCss),
  },
];
for (const rule of structuralRules) {
  console.log(`${rule.present ? 'PASS' : 'FAIL'}  structural: ${rule.name}`);
  if (!rule.present) failures.push({ theme: 'css', pair: { name: rule.name, min: '—' }, ratio: 0, fg: '—', bg: '—' });
}

console.log(`\n${rows.length} pairs audited across ${themes.size} theme(s): ${themes.has('tet') ? 'base' : ''}${[...themes.keys()].filter((t) => t !== 'base').map((t) => `, ${t}`).join('')}`);

if (failures.length > 0) {
  console.error(`\ncheck-contrast: ${failures.length} pair(s) below threshold:`);
  for (const f of failures) {
    console.error(`  [${f.theme}] ${f.pair.name}: ${f.ratio.toFixed(2)}:1 < ${f.pair.min}:1 (${f.fg} on ${f.bg})`);
  }
  process.exit(1);
}
console.log('check-contrast: all pairs pass.');
