#!/usr/bin/env node
/**
 * Dependency-free sitemap generator (seo-proposal.md P0-6).
 *
 * Reads src/data/products.json plus the four static indexable routes and
 * writes dist/sitemap.xml — one absolute <loc> per page. Same input → same
 * output, so it is safe to re-run.
 *
 * URL set: `/`, `/about/`, `/contact/`, `/products/` and every product page
 * `/products/<slug>/` (getStaticPaths builds one page per products.json
 * entry — src/pages/products/[slug].astro). `/404` is deliberately excluded:
 * error pages never belong in a sitemap. No `lastmod`: this repo has no
 * trustworthy modified-date source, and a fabricated date is worse than none.
 *
 * Every URL is absolute with the https://fropppy.github.io/gift-business/
 * prefix — SITE_ORIGIN + BASE_PATH below must match `site` + `base` in
 * astro.config.mjs. Trailing slashes follow build.format 'directory'
 * (GitHub Pages serves <dir>/index.html at <dir>/).
 *
 * robots.txt is NOT generated: it is a static file at public/robots.txt and
 * Astro copies public/ into dist/ verbatim on every build (deploys included),
 * so it needs no build hook.
 *
 * Run: node scripts/generate-sitemap.mjs   (or: npm run generate:sitemap)
 * Wired into `npm run build` ("astro build && node scripts/generate-sitemap.mjs")
 * rather than a postbuild hook: the build script body runs under every
 * package manager's `run` semantics, while pre/post lifecycle hooks are an
 * npm default (pnpm does not run them by default). Deploy builds go through
 * withastro/action, whose Build step is `$PACKAGE_MANAGER run build` with npm
 * auto-detected from package-lock.json — so the sitemap regenerates on every
 * deploy, not only in CI. Exits 1 (failing the chained build) if dist/ is
 * missing or the URL list would contain duplicates.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');

// Must match astro.config.mjs: site: 'https://fropppy.github.io', base: '/gift-business'.
const SITE_ORIGIN = 'https://fropppy.github.io';
const BASE_PATH = '/gift-business';

// Static indexable routes, trailing-slash form. /404 is excluded on purpose.
const STATIC_ROUTES = ['/', '/about/', '/contact/', '/products/'];

/* ---- fail loudly if run before a build (dist/ is created by astro build) ---- */
if (!existsSync(DIST)) {
  console.error('generate-sitemap: dist/ not found — run `astro build` first (this script is chained after it in `npm run build`).');
  process.exit(1);
}

/* ---- build the URL list from the same data getStaticPaths uses ---- */
const data = JSON.parse(readFileSync(join(ROOT, 'src/data/products.json'), 'utf8'));
const urls = [
  ...STATIC_ROUTES,
  ...data.products.map((p) => `/products/${p.slug}/`),
].map((route) => SITE_ORIGIN + BASE_PATH + route);

const seen = new Set();
for (const url of urls) {
  if (seen.has(url)) {
    console.error(`generate-sitemap: duplicate URL in list (duplicate product slug?): ${url}`);
    process.exit(1);
  }
  seen.add(url);
}

// Minimal XML text escaping — slug routes are ASCII today, but stay correct
// if a future route ever carries & < > characters.
const xmlEscape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map((url) => `  <url>\n    <loc>${xmlEscape(url)}</loc>\n  </url>`).join('\n') +
  '\n</urlset>\n';

writeFileSync(join(DIST, 'sitemap.xml'), xml);
console.log(
  `Generated dist/sitemap.xml (${urls.length} URLs: ${STATIC_ROUTES.length} static routes + ${data.products.length} product pages; /404 excluded)`
);
