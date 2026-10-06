#!/usr/bin/env node
/**
 * Deterministic output gate for the built site (run AFTER `npm run build`).
 *
 * Asserts, against dist/, the requirements of docs/design-language.md and the
 * run's mandatory amendments:
 *
 *   1. The is:inline theme head script is present in dist/index.html <head>
 *      (before </head>): it reads localStorage 'nm:theme', validates against
 *      the whitelist (base / tet / trung-thu), handles data-theme, and sets
 *      data-theme-ui="on" (§2.4/§2.5/§2.7).
 *   2. A theme switcher control is rendered: .theme-switch markup with a
 *      choice for every whitelisted theme plus the Auto option (§2.4).
 *   3. dist/contact/index.html uses the renamed FAQ classes (.faq-grid /
 *      .faq-card) and contains ZERO occurrences of class="testi… (amendment
 *      to plan step 6); /contact/ content itself stays intact.
 *   4. All occasion chips are server-rendered: every occasion name from
 *      src/data/occasions.json appears in dist/index.html and the rendered
 *      chip count equals the data count (amendment to plan step 5).
 *   5. The invented testimonials are gone site-wide: no "Chị Hương", no
 *      class="stars", zero class="testi… anywhere under dist/ (step 6).
 *   6. The carousel is gone: no data-carousel / hero-dot markup (step 5).
 *
 * Exit 1 on any failed assertion.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const repoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const distDir = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(repoRoot, 'dist');

const failures = [];

function assert(name, pass, detail = '') {
  if (pass) {
    console.log(`PASS  ${name}${detail ? ` — ${detail}` : ''}`);
  } else {
    failures.push(name + (detail ? ` — ${detail}` : ''));
    console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

if (!existsSync(distDir)) {
  console.error(`check-output: dist directory not found at ${distDir} — run \`npm run build\` first.`);
  process.exit(1);
}

const read = (p) => {
  const full = path.join(distDir, p);
  if (!existsSync(full)) return null;
  return readFileSync(full, 'utf8');
};

const indexHtml = read('index.html');
assert('dist/index.html exists', indexHtml !== null);

/* --- 1. inline theme script in <head>, with whitelist + storage + UI gate --- */
if (indexHtml) {
  const headEnd = indexHtml.indexOf('</head>');
  const head = headEnd === -1 ? '' : indexHtml.slice(0, headEnd);
  // Plain (attribute-less) <script> blocks in <head> — the is:inline theme
  // script must be one of these: synchronous, pre-paint, not type=module.
  const plainHeadScripts = [...head.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const themeScript = plainHeadScripts.find((s) => s.includes('data-theme')) ?? null;
  const themeScriptMatch = themeScript === null ? null : [null, themeScript];

  assert(
    'theme script present in <head> (plain, pre-paint <script>, not type=module)',
    themeScript !== null,
    `${plainHeadScripts.length} plain <script> block(s) in <head>; theme block ${
      themeScript === null ? 'NOT found' : 'found'
    }`
  );
  assert(
    'theme script persists manual choice via localStorage nm:theme',
    themeScriptMatch !== null && themeScriptMatch[0].includes("localStorage") && themeScriptMatch[0].includes('nm:theme')
  );
  assert(
    'theme whitelist covers base/tet/trung-thu',
    themeScriptMatch !== null &&
      themeScriptMatch[0].includes("'base'") &&
      themeScriptMatch[0].includes("'tet'") &&
      themeScriptMatch[0].includes("'trung-thu'")
  );
  assert(
    'data-theme handling: script sets data-theme attribute',
    themeScriptMatch !== null && themeScriptMatch[0].includes("setAttribute('data-theme'")
  );
  assert(
    'script enables the switcher via data-theme-ui',
    themeScriptMatch !== null && themeScriptMatch[0].includes("data-theme-ui")
  );
  assert(
    'seasonal auto map: Nov–Feb → tet, September → trung-thu',
    themeScriptMatch !== null &&
      /getMonth\(\)\s*\+\s*1/.test(themeScriptMatch[0]) &&
      themeScriptMatch[0].includes("'trung-thu'")
  );

  /* --- 2. theme switcher control rendered --- */
  const switcherCount = (indexHtml.match(/class="[^"]*theme-switch/g) || []).length;
  assert(
    'theme switcher control rendered',
    switcherCount >= 1,
    `${switcherCount} .theme-switch instance(s)`
  );
  for (const choice of ['auto', 'tet', 'trung-thu']) {
    assert(
      `switcher offers choice "${choice}"`,
      new RegExp(`data-theme-choice="${choice}"`).test(indexHtml)
    );
  }

  /* --- 4. all occasion chips server-rendered --- */
  const occasionsPath = path.join(repoRoot, 'src', 'data', 'occasions.json');
  const occasions = JSON.parse(readFileSync(occasionsPath, 'utf8'));
  const chipCount = (indexHtml.match(/class="occ-chip"/g) || []).length;
  assert(
    'every occasion chip is server-rendered (count matches data)',
    chipCount === occasions.length,
    `${chipCount} chips rendered, ${occasions.length} in occasions.json`
  );
  const missingNames = occasions.filter((o) => !indexHtml.includes(o.name)).map((o) => o.name);
  assert(
    'every occasion name appears in rendered HTML',
    missingNames.length === 0,
    missingNames.length ? `missing: ${missingNames.join(', ')}` : `${occasions.length} names found`
  );

  /* --- 6. carousel machinery gone --- */
  assert(
    'carousel machinery deleted (no data-carousel, no hero-dot)',
    !indexHtml.includes('data-carousel') && !indexHtml.includes('hero-dot')
  );

  /* --- 5a. invented testimonials gone from the homepage --- */
  assert(
    'invented testimonial customers gone (no "Chị Hương")',
    !indexHtml.includes('Chị Hương')
  );
  assert('star-rating widget gone (no class="stars")', !indexHtml.includes('class="stars"'));
}

/* --- 3. contact page: renamed FAQ classes, zero testi, /contact/ intact --- */
const contactHtml = read(path.join('contact', 'index.html'));
assert('dist/contact/index.html exists', contactHtml !== null);
if (contactHtml) {
  assert(
    'contact FAQ uses renamed .faq-grid/.faq-card classes',
    contactHtml.includes('faq-grid') && contactHtml.includes('faq-card')
  );
  const testiOccurrences = (contactHtml.match(/class="testi/g) || []).length;
  assert(
    'contact page has zero occurrences of class="testi…',
    testiOccurrences === 0,
    `${testiOccurrences} occurrence(s)`
  );
  /* /contact/ stays intact: the FAQ headings still render */
  for (const heading of ['Giao được khu vực nào?', 'Giá trên web đã chốt chưa?', 'Cần giỏ theo ngân sách riêng?']) {
    assert(`contact FAQ question intact: "${heading}"`, contactHtml.includes(heading));
  }
}

/* --- 5b. site-wide sweep: no testimonial classes anywhere under dist/ --- */
function walkHtml(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walkHtml(full, acc);
    else if (entry.endsWith('.html')) acc.push(full);
  }
  return acc;
}
const allHtml = walkHtml(distDir);
const offenders = allHtml.filter((f) => /class="testi|class="stars"/.test(readFileSync(f, 'utf8')));
assert(
  'no class="testi…" / class="stars" anywhere under dist/',
  offenders.length === 0,
  offenders.length ? `found in: ${offenders.map((f) => path.relative(distDir, f)).join(', ')}` : `${allHtml.length} HTML files swept`
);

console.log(`\ncheck-output: ${allHtml.length} HTML files checked under ${distDir}`);
if (failures.length > 0) {
  console.error(`\ncheck-output: ${failures.length} assertion(s) failed:`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('check-output: all assertions pass.');
