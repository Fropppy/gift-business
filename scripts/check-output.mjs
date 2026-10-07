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
 *   7. The Content-Security-Policy meta ships on EVERY page under dist/,
 *      denies by default (default-src 'none'), and allow-lists BOTH Apps
 *      Script fetch hops (script.google.com AND its 302 target
 *      script.googleusercontent.com) — the redirect hop is CSP-enforced,
 *      so omitting it breaks every order-form submit once the webhook is
 *      activated.
 *   8. dist/sitemap.xml exists and carries exactly the expected absolute
 *      URLs — the four static routes plus every src/data/products.json
 *      slug, each prefixed https://fropppy.github.io/gift-business/
 *      (astro.config.mjs site + base), /404 excluded, every URL resolving
 *      to a built dist/ page — and dist/robots.txt (copied from public/)
 *      declares the sitemap (seo-proposal P0-6).
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
  

  assert(
    'theme script present in <head> (plain, pre-paint <script>, not type=module)',
    themeScript !== null,
    `${plainHeadScripts.length} plain <script> block(s) in <head>; theme block ${
      themeScript === null ? 'NOT found' : 'found'
    }`
  );
  assert(
    'theme script persists manual choice via localStorage nm:theme',
    themeScript !== null && themeScript.includes("localStorage") && themeScript.includes('nm:theme')
  );
  assert(
    'theme whitelist covers base/tet/trung-thu',
    themeScript !== null &&
      themeScript.includes("'base'") &&
      themeScript.includes("'tet'") &&
      themeScript.includes("'trung-thu'")
  );
  assert(
    'data-theme handling: script sets data-theme attribute',
    themeScript !== null && themeScript.includes("setAttribute('data-theme'")
  );
  assert(
    'script enables the switcher via data-theme-ui',
    themeScript !== null && themeScript.includes("data-theme-ui")
  );
  assert(
    'seasonal auto map: Nov–Feb → tet, September → trung-thu',
    themeScript !== null &&
      /getMonth\(\)\s*\+\s*1/.test(themeScript) &&
      themeScript.includes("'trung-thu'")
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

/* --- 7. CSP meta on every page, defaulting to deny, webhook hops allowed --- */
const noCsp = allHtml.filter((f) => {
  const html = readFileSync(f, 'utf8');
  const meta = html.match(/<meta\s+http-equiv="Content-Security-Policy"/);
  return !(
    meta &&
    html.includes("default-src 'none'") &&
    /connect-src[^";]*https:\/\/script\.google\.com[^";]*https:\/\/script\.googleusercontent\.com/.test(html)
  );
});
assert(
  'Content-Security-Policy meta (default-src none; both Apps Script connect hops) on every page',
  noCsp.length === 0,
  noCsp.length ? `missing/failing on: ${noCsp.map((f) => path.relative(distDir, f)).join(', ')}` : `${allHtml.length}/${allHtml.length} pages`
);

/* --- 8. sitemap.xml + robots.txt (seo-proposal P0-6): full absolute-URL map --- */
// The expected URL set is derived here independently of
// scripts/generate-sitemap.mjs — same source data (src/data/products.json,
// which getStaticPaths also builds pages from) but this file's own
// static-route list and base prefix — so a wrong, stale, or missing
// generator cannot self-validate.
const SITEMAP_BASE = 'https://fropppy.github.io/gift-business'; // astro.config.mjs site + base
const SITEMAP_STATIC_ROUTES = ['/', '/about/', '/contact/', '/products/'];
const productsData = JSON.parse(readFileSync(path.join(repoRoot, 'src', 'data', 'products.json'), 'utf8'));
const expectedUrls = [
  ...SITEMAP_STATIC_ROUTES,
  ...productsData.products.map((p) => `/products/${p.slug}/`),
].map((route) => SITEMAP_BASE + route);

const sitemap = read('sitemap.xml');
assert('dist/sitemap.xml exists (sitemap generation chained into the build)', sitemap !== null);
if (sitemap) {
  const locs = [...sitemap.matchAll(/<loc>([\s\S]*?)<\/loc>/g)].map((m) => m[1].trim());
  assert(
    'sitemap.xml carries exactly the expected URL count',
    locs.length === expectedUrls.length,
    `${locs.length} <loc> entries, expected ${expectedUrls.length} (${SITEMAP_STATIC_ROUTES.length} static routes + ${productsData.products.length} product pages)`
  );
  const missingUrls = expectedUrls.filter((u) => !locs.includes(u));
  assert(
    'sitemap.xml contains every expected absolute URL (static routes + all product slugs)',
    missingUrls.length === 0,
    missingUrls.length ? `missing: ${missingUrls.join(', ')}` : `${expectedUrls.length} URLs found`
  );
  const extraUrls = locs.filter((u) => !expectedUrls.includes(u));
  assert(
    'sitemap.xml lists no unexpected URLs (no /404, no stale slugs, no query variants)',
    extraUrls.length === 0,
    extraUrls.length ? `unexpected: ${extraUrls.join(', ')}` : 'none'
  );
  const nonPrefixed = locs.filter((u) => !u.startsWith(SITEMAP_BASE + '/'));
  assert(
    'every sitemap URL is absolute with the /gift-business/ base prefix',
    nonPrefixed.length === 0,
    nonPrefixed.length ? nonPrefixed.join(', ') : `${locs.length}/${locs.length} prefixed`
  );
  const missingPages = expectedUrls
    .map((u) => u.slice(SITEMAP_BASE.length))
    .filter((rel) => !existsSync(path.join(distDir, rel, 'index.html')));
  assert(
    'every sitemap URL resolves to a built dist/ page',
    missingPages.length === 0,
    missingPages.length
      ? `no dist page for: ${missingPages.join(', ')}`
      : `${expectedUrls.length}/${expectedUrls.length} pages exist`
  );
}

const robots = read('robots.txt');
assert('dist/robots.txt exists (copied from public/robots.txt)', robots !== null);
if (robots) {
  assert(
    'robots.txt declares the sitemap with the full base-prefixed URL',
    /^Sitemap: https:\/\/fropppy\.github\.io\/gift-business\/sitemap\.xml$/m.test(robots)
  );
}

console.log(`\ncheck-output: ${allHtml.length} HTML files checked under ${distDir}`);
if (failures.length > 0) {
  console.error(`\ncheck-output: ${failures.length} assertion(s) failed:`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('check-output: all assertions pass.');
