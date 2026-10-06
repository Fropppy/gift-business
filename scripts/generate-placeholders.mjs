#!/usr/bin/env node
/**
 * Deterministic placeholder-art generator — no real photos exist yet.
 *
 * Reads src/data/products.json and writes one 800×600 SVG per product slug
 * into public/images/products/, plus a shared placeholder.svg. Same input →
 * same output (seeded by a djb2 hash of the slug), so it is safe to re-run.
 *
 * All colors come from the site palette. Files in public/ are copied to the
 * build as-is (no transform step can fail); a missing file makes cards fall
 * back to placeholder.svg, so the build never breaks on data drift.
 *
 * Run: node scripts/generate-placeholders.mjs   (or: npm run generate:placeholders)
 * Later, replace with real photos: drop .jpg/.avif into the same folder and
 * update images[] in products.json — no component changes needed.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'public', 'images', 'products');

// Site palette (must stay in sync with src/styles/global.css tokens)
const P = {
  cream: '#FAF6EF',
  surface: '#FFFFFF',
  pine: '#1E5C46',
  pineDeep: '#16473A',
  terra: '#C96F2F',
  red: '#C0272D',
  gold: '#C89B3C',
  cocoa: '#2B2118',
  border: '#E7DCC8',
  borderStrong: '#D8CBB8',
};

// Per-category art direction: glyph type + palette assignment
const CATEGORY_STYLE = {
  'gio-trai-cay-cao-cap': { glyph: 'fruit', body: P.pine, rim: P.pineDeep, ribbon: P.terra, fills: [P.red, P.gold, P.terra, P.pine], halo: P.pine },
  'gio-qua-tet': { glyph: 'fruit', body: P.red, rim: '#A11F26', ribbon: P.gold, fills: [P.gold, P.red, P.terra], halo: P.red, mai: true },
  'qua-tang-doanh-nghiep': { glyph: 'box', box: P.surface, lid: P.pine, ribbon: P.gold, halo: P.pine },
  'gio-qua-sinh-nhat-hoa': { glyph: 'flowers', body: P.terra, rim: '#B25D22', ribbon: P.red, petals: [P.red, P.gold, P.terra], halo: P.terra },
  'hop-qua-tang-cao-cap': { glyph: 'box', box: P.cream, lid: P.gold, ribbon: P.cocoa, halo: P.gold },
  'qua-khai-truong-tan-gia': { glyph: 'fruit', body: P.pine, rim: P.pineDeep, ribbon: P.red, fills: [P.gold, P.red, P.terra], halo: P.red, mai: true },
  'set-qua-trung-thu': { glyph: 'box', box: P.surface, lid: P.gold, ribbon: P.red, halo: P.gold, moon: true },
};

const NEUTRAL = { glyph: 'fruit', body: P.cocoa, rim: '#1E160F', ribbon: P.borderStrong, fills: [P.borderStrong, P.border, P.terra], halo: P.cocoa };

/* deterministic RNG: djb2 hash → mulberry32 */
function seedFrom(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return h >>> 0;
}
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r2 = (n) => Math.round(n * 100) / 100;

function background(style, rng) {
  let dots = '';
  for (let i = 0; i < 14; i++) {
    dots += `<circle cx="${r2(40 + rng() * 720)}" cy="${r2(30 + rng() * 520)}" r="${r2(2 + rng() * 3)}" fill="${P.border}" opacity="0.7"/>\n`;
  }
  return `<rect width="800" height="600" fill="${P.cream}"/>
<circle cx="400" cy="290" r="250" fill="${style.halo}" opacity="0.07"/>
${dots}`;
}

function fruitCircle(cx, cy, r, fill, rng) {
  const leaf = `<ellipse cx="${r2(cx + 6)}" cy="${r2(cy - r - 7)}" rx="12" ry="5.5" fill="${P.pine}" transform="rotate(-24 ${r2(cx + 6)} ${r2(cy - r - 7)})"/>`;
  const shine = `<path d="M ${r2(cx - r * 0.42)} ${r2(cy - r * 0.42)} q ${r2(r * 0.16)} ${r2(-r * 0.18)} ${r2(r * 0.34)} 0" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.55"/>`;
  const rot = r2(-14 + rng() * 28);
  return `<g transform="rotate(${rot} ${cx} ${cy})">\n${leaf}\n<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>\n${shine}\n</g>\n`;
}

function grapeBunch(cx, cy, fill) {
  let g = '';
  const pos = [[0, 0], [24, 8], [-24, 8], [12, 26], [-12, 26], [0, 46]];
  for (const [dx, dy] of pos) g += `<circle cx="${cx + dx}" cy="${cy + dy}" r="13" fill="${fill}"/>\n`;
  return g;
}

function maiFlower(cx, cy, s) {
  let petals = '';
  for (let i = 0; i < 5; i++) {
    const a = i * 72;
    petals += `<ellipse cx="0" cy="${-9 * s}" rx="${4.6 * s}" ry="${9 * s}" fill="${P.gold}" transform="rotate(${a})"/>\n`;
  }
  return `<g transform="translate(${cx} ${cy})">\n${petals}<circle r="${3.4 * s}" fill="${P.red}"/>\n</g>\n`;
}

function bow(cx, cy, color, s = 1) {
  return `<g transform="translate(${cx} ${cy}) scale(${s})">
<path d="M0 0 C -34 -22 -58 -4 -40 12 C -28 22 -10 12 0 0 Z" fill="${color}"/>
<path d="M0 0 C 34 -22 58 -4 40 12 C 28 22 10 12 0 0 Z" fill="${color}"/>
<path d="M-6 4 C -18 26 -30 34 -38 40 L -28 42 C -16 34 -6 20 2 8 Z" fill="${color}" opacity="0.85"/>
<path d="M6 4 C 18 26 30 34 38 40 L 28 42 C 16 34 6 20 -2 8 Z" fill="${color}" opacity="0.85"/>
<circle r="9" fill="${color}" stroke="${P.cream}" stroke-width="2.5"/>
</g>\n`;
}

function basketGlyph(style, rng) {
  // handle (behind contents)
  const handle = `<path d="M262 316 C 300 172, 500 172, 538 316" stroke="${style.body}" stroke-width="13" stroke-linecap="round" fill="none"/>`;
  // contents: 5–7 fruits along the rim
  const n = 5 + Math.floor(rng() * 3);
  let contents = '';
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const cx = r2(250 + t * 300 + (rng() - 0.5) * 26);
    const cy = r2(268 - rng() * 30 - (i % 2) * 16);
    const r = r2(28 + rng() * 13);
    if (rng() < 0.22) contents += grapeBunch(cx, cy, style.fills[i % style.fills.length]);
    else contents += fruitCircle(cx, cy, r, style.fills[i % style.fills.length], rng);
  }
  // basket body with woven texture (clip → stakes + wavy bands)
  const body = `<path d="M198 306 L602 306 L536 502 Q400 528 264 502 Z" fill="${style.body}"/>`;
  let weave = '';
  for (let y = 328; y < 516; y += 26) {
    let d = `M188 ${y}`;
    for (let x = 188; x < 620; x += 54) d += ` q27 -9 54 0`;
    weave += `<path d="${d}" stroke="${P.border}" stroke-width="7" fill="none" opacity="0.65"/>\n`;
  }
  for (let x = 230; x < 590; x += 46) {
    weave += `<line x1="${x}" y1="306" x2="${r2(x - (x - 400) * 0.12)}" y2="512" stroke="${style.rim}" stroke-width="4" opacity="0.35"/>\n`;
  }
  const rim = `<rect x="186" y="290" width="428" height="30" rx="15" fill="${style.rim}"/>`;
  const extras = (style.mai ? maiFlower(120, 130, 1) + maiFlower(688, 96, 0.8) + maiFlower(660, 190, 0.6) : '')
    + (style.moon ? `<circle cx="636" cy="118" r="58" fill="${P.gold}" opacity="0.9"/><circle cx="620" cy="106" r="10" fill="${P.cream}" opacity="0.5"/><circle cx="652" cy="132" r="7" fill="${P.cream}" opacity="0.4"/>` : '');
  const shadow = `<ellipse cx="400" cy="540" rx="215" ry="24" fill="${P.cocoa}" opacity="0.08"/>`;
  return `${shadow}\n${extras}\n${handle}\n<clipPath id="bclip"><path d="M198 306 L602 306 L536 502 Q400 528 264 502 Z"/></clipPath>\n${contents}\n${body}\n<g clip-path="url(#bclip)">${weave}</g>\n${rim}\n${bow(400, 486, style.ribbon, 1)}\n`;
}

function flowersGlyph(style, rng) {
  const base = basketGlyph({ ...style, glyph: 'fruit', fills: [P.border, P.borderStrong] , ribbon: style.ribbon }, rng);
  let flowers = '';
  const xs = [318, 400, 482];
  xs.forEach((cx, i) => {
    const cy = 210 + (i % 2) * 26;
    const color = style.petals[i % style.petals.length];
    let petals = '';
    for (let k = 0; k < 6; k++) {
      const a = k * 60 + (rng() * 14 - 7);
      petals += `<ellipse cx="0" cy="-26" rx="13" ry="24" fill="${color}" transform="rotate(${r2(a)})"/>\n`;
    }
    flowers += `<line x1="${cx}" y1="${cy}" x2="${cx}" y2="310" stroke="${P.pine}" stroke-width="5"/>\n<g transform="translate(${cx} ${cy})">${petals}<circle r="13" fill="${P.gold}"/></g>\n`;
  });
  // baby's breath dots
  let dots = '';
  for (let i = 0; i < 10; i++) {
    dots += `<circle cx="${r2(290 + rng() * 220)}" cy="${r2(170 + rng() * 110)}" r="5" fill="${i % 2 ? P.surface : P.gold}" opacity="0.9"/>\n`;
  }
  return `${dots}\n${flowers}\n${base}`;
}

function boxGlyph(style, rng) {
  const shadow = `<ellipse cx="400" cy="520" rx="200" ry="22" fill="${P.cocoa}" opacity="0.08"/>`;
  const extras = style.moon
    ? `<circle cx="636" cy="118" r="58" fill="${P.gold}" opacity="0.9"/><circle cx="620" cy="106" r="10" fill="${P.cream}" opacity="0.5"/>`
    : `<circle cx="170" cy="130" r="6" fill="${P.gold}" opacity="0.8"/><circle cx="210" cy="100" r="4" fill="${P.red}" opacity="0.7"/><circle cx="650" cy="140" r="5" fill="${P.terra}" opacity="0.7"/>`;
  // back box
  const back = `<g>
<rect x="470" y="330" width="210" height="150" rx="12" fill="${P.cream}" stroke="${P.border}" stroke-width="2"/>
<rect x="458" y="306" width="234" height="52" rx="12" fill="${style.lid === P.pine ? P.pine : P.gold}" opacity="0.9"/>
<rect x="558" y="306" width="34" height="174" fill="${style.ribbon}" opacity="0.9"/>
</g>`;
  // main box
  const main = `<g>
<rect x="228" y="300" width="300" height="212" rx="14" fill="${style.box}" stroke="${P.border}" stroke-width="2.5"/>
<rect x="210" y="258" width="336" height="72" rx="14" fill="${style.lid}" stroke="${P.border}" stroke-width="2"/>
<rect x="346" y="258" width="44" height="254" fill="${style.ribbon}"/>
</g>`;
  // tag card
  const tag = `<g transform="rotate(-8 600 420)">
<rect x="560" y="392" width="86" height="58" rx="8" fill="${P.surface}" stroke="${P.borderStrong}" stroke-width="2"/>
<line x1="574" y1="412" x2="632" y2="412" stroke="${P.borderStrong}" stroke-width="4" stroke-linecap="round"/>
<line x1="574" y1="428" x2="618" y2="428" stroke="${P.borderStrong}" stroke-width="4" stroke-linecap="round"/>
<circle cx="603" cy="378" r="5" fill="${P.cocoa}"/>
<line x1="603" y1="383" x2="596" y2="396" stroke="${P.cocoa}" stroke-width="2"/>
</g>`;
  return `${shadow}\n${extras}\n${back}\n${main}\n${bow(368, 262, style.ribbon, 1.15)}\n${tag}\n`;
}

function svgFor(name, slug, style, rng) {
  const glyph =
    style.glyph === 'box' ? boxGlyph(style, rng) : style.glyph === 'flowers' ? flowersGlyph(style, rng) : basketGlyph(style, rng);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600" role="img">
<title>${name}</title>
${background(style, rng)}
${glyph}</svg>
`;
}

/* ---- main ---- */
const data = JSON.parse(readFileSync(join(ROOT, 'src/data/products.json'), 'utf8'));
mkdirSync(OUT_DIR, { recursive: true });

let count = 0;
for (const p of data.products) {
  const style = CATEGORY_STYLE[p.category] ?? NEUTRAL;
  const svg = svgFor(p.name, p.slug, style, mulberry32(seedFrom(p.slug)));
  writeFileSync(join(OUT_DIR, `${p.slug}.svg`), svg);
  count++;
}

// shared neutral fallback
writeFileSync(
  join(OUT_DIR, 'placeholder.svg'),
  svgFor('Giỏ quà', 'placeholder', NEUTRAL, mulberry32(seedFrom('placeholder')))
);
count++;

console.log(`Generated ${count} SVG placeholders in public/images/products/ (${data.products.length} products + shared placeholder)`);
