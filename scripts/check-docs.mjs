#!/usr/bin/env node
/**
 * Deterministic docs gate for the documentation + memory system
 * (run via `npm run check:docs` — cheapest gate, safe before `npm run build`).
 *
 * Asserts, against the tracked markdown set:
 *
 *   1. All 9 gated doc files exist and are non-empty.
 *   2. AGENTS.md carries the literal pointer sentence to ZCODE.md.
 *   3. Required `## ` sections are present per file (exact heading text).
 *   4. Every relative markdown link target resolves to an existing file
 *      (README.md, AGENTS.md, ZCODE.md, every .md under docs/ recursively,
 *      and apps-script/SETUP.md; http/https/mailto:/tel:/# targets skipped;
 *      #anchor suffix stripped; resolved against the linking file's dir).
 *   5. Index completeness: every .md under docs/ (recursive walk) is linked
 *      from docs/README.md (anti-rot rule), which also links README.md,
 *      ZCODE.md, AGENTS.md, and apps-script/SETUP.md.
 *   6. Every `npm run <name>` token in AGENTS.md / ZCODE.md is a key of
 *      package.json .scripts.
 *   7. Gate wiring: package.json scripts.check:docs === 'node
 *      scripts/check-docs.mjs' and .github/workflows/check.yml runs it.
 *   8. Size budgets: AGENTS.md <= 80 lines, ZCODE.md <= 400 lines.
 *   9. ADR integrity in docs/decisions.md: >= 7 ADR headings, each heading
 *      matching `## ADR-NNNN: Title (YYYY-MM-DD, accepted|rejected|
 *      superseded by ADR-MMMM)...)` exactly, Context/Decision/Consequences
 *      counts each equal to the ADR count, numbering exactly 0001..N in
 *      file order (no gaps, no reuse).
 *  10. Improvement-log format: append-only marker present, >= 1 dated entry
 *      (`## YYYY-MM-DD — `), entry dates non-decreasing in file order.
 *  11. README.md contains a markdown link that resolves to docs/README.md.
 *  12. No machine-local absolute paths: none of the gated docs contain the
 *      string '/home/' (personal-memory paths are written with '~/').
 *  13. Markdown anchors: every relative file.md#anchor link resolves to a
 *      heading slug in the target file (GitHub-style slugs) — heading
 *      rewords break deep links loudly, not silently.
 *  14. ZCODE.md orientation-map completeness: every .md under docs/ is also
 *      linked from ZCODE.md (the AI routing table cannot rot while the
 *      docs/README.md index stays fresh).
 *  15. AGENTS.md ↔ ZCODE.md sync: canary phrases sampled from every block
 *      the two files duplicate (gates, git, never-touch, ask-first,
 *      non-obvious facts) must appear in BOTH files — a presence sample,
 *      not a semantic diff of the shared rule-set.
 *  16. Token-count integrity: src/styles/global.css :root declares exactly
 *      the documented 56 custom properties, and the phrase '56 custom
 *      properties' is stated in ZCODE.md and docs/architecture.md — token
 *      57 fails the gate until docs and constant move together.
 *  17. Citation anchors: the two load-bearing file:line citations the docs
 *      lean on are asserted — site.json 'orderEndpoint' on line 16,
 *      check.yml job id 'check' on line 15.
 *  18. Citation integrity over the LIVING gated docs (append-only
 *      records docs/decisions.md and docs/ai/improvement-log.md are
 *      excluded — their citations are claims about their writing time):
 *      every `file.ext:line[-line]` token must resolve to an existing
 *      file with in-range lines (mechanical), and a curated CITED_FACTS
 *      table pins the load-bearing content at every cited range
 *      (semantic) — a line insert in Code.gs or BaseLayout.astro fails
 *      the gate until the citing docs move with it.
 *
 * The npm-run reference check (6) walks the full link-checked set
 * (README.md, AGENTS.md, ZCODE.md, every .md under docs/, SETUP.md)
 * EXCEPT docs/research/ — verbatim historical research that quotes
 * third-party repos' commands, which are not references to OUR scripts.
 *
 * Zero dependencies: imports only node:fs, node:path, node:url.
 * Exit 1 on any failed assertion.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const repoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const failures = [];

function assert(name, pass, detail = '') {
  if (pass) {
    console.log(`PASS  ${name}${detail ? ` — ${detail}` : ''}`);
  } else {
    failures.push(name + (detail ? ` — ${detail}` : ''));
    console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

const read = (rel) => readFileSync(path.join(repoRoot, rel), 'utf8');
const relOf = (abs) => path.relative(repoRoot, abs).split(path.sep).join('/');

/* ------------------------------------------------------------------ setup */

const GATED_DOCS = [
  'AGENTS.md',
  'ZCODE.md',
  'docs/README.md',
  'docs/architecture.md',
  'docs/decisions.md',
  'docs/operations.md',
  'docs/roadmap.md',
  'docs/ai/memory-system.md',
  'docs/ai/improvement-log.md',
];

const REQUIRED_SECTIONS = {
  'AGENTS.md': ['Read first', 'Gates', 'Git', 'Never touch'],
  'ZCODE.md': [
    'Orientation map',
    'Commands',
    'Working rules',
    'Memory model',
    'Project facts',
    'Session checklist',
  ],
  'docs/README.md': ['Reading order'],
  'docs/architecture.md': ['Order pipeline', 'Build, CI/CD'],
  'docs/operations.md': ['Replacing placeholder content', 'Orders'],
  'docs/roadmap.md': ['Now', 'Later'],
  'docs/decisions.md': ['How to add a decision'],
  'docs/ai/memory-system.md': ['Layer 1', 'Layer 2', 'Layer 3', 'Session rituals'],
  'docs/ai/improvement-log.md': ['Entry format'],
};

/** Inline markdown link targets: [label](target) and ![alt](src), titles trimmed. */
function extractLinkTargets(text) {
  return [...text.matchAll(/\[([^\]]*)\]\(([^)]+)\)/g)].map((m) =>
    m[2].trim().split(/\s+/)[0]
  );
}

const isSkippedTarget = (t) => {
  const l = t.toLowerCase();
  return (
    l.startsWith('http://') ||
    l.startsWith('https://') ||
    l.startsWith('mailto:') ||
    l.startsWith('tel:') ||
    l.startsWith('#')
  );
};
const stripAnchor = (t) => t.split('#')[0];

/** GitHub-style heading slug: lowercase, drop non-word punctuation, spaces → -. */
function githubSlug(heading) {
  return heading
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-');
}

const slugCache = new Map();
function headingSlugs(file) {
  if (!slugCache.has(file)) {
    const seen = new Map();
    const slugs = new Set();
    for (const m of readFileSync(file, 'utf8').matchAll(/^#{1,6}\s+(.+)$/gm)) {
      let slug = githubSlug(m[1]);
      const n = seen.get(slug) || 0;
      seen.set(slug, n + 1);
      if (n > 0) slug = `${slug}-${n}`;
      slugs.add(slug);
    }
    slugCache.set(file, slugs);
  }
  return slugCache.get(file);
}

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

const docsDir = path.join(repoRoot, 'docs');
const docsMd = walk(docsDir).filter((f) => f.endsWith('.md')).sort();
const LINK_CHECKED = [
  path.join(repoRoot, 'README.md'),
  path.join(repoRoot, 'AGENTS.md'),
  path.join(repoRoot, 'ZCODE.md'),
  ...docsMd,
  path.join(repoRoot, 'apps-script', 'SETUP.md'),
];

/* ------------------------------------------- 1. existence + non-empty files */

const emptyOrMissing = GATED_DOCS.filter((f) => {
  const full = path.join(repoRoot, f);
  return !existsSync(full) || readFileSync(full, 'utf8').length === 0;
});
assert(
  'gated doc files exist and are non-empty',
  emptyOrMissing.length === 0,
  emptyOrMissing.length
    ? `missing/empty: ${emptyOrMissing.join(', ')}`
    : `${GATED_DOCS.length} files`
);

/* --------------------------------------------- 2. AGENTS.md → ZCODE.md gate */

const pointerSentence = 'Read [ZCODE.md](ZCODE.md) before any work in this repo.';
assert(
  'AGENTS.md contains the ZCODE.md pointer sentence',
  read('AGENTS.md').includes(pointerSentence)
);

/* ---------------------------------------------------- 3. required sections */

for (const [file, required] of Object.entries(REQUIRED_SECTIONS)) {
  const headings = new Set(
    [...read(file).matchAll(/^## (.+)$/gm)].map((m) => m[1].trim())
  );
  const missing = required.filter((s) => !headings.has(s));
  assert(
    `${file} required sections`,
    missing.length === 0,
    missing.length ? `missing: ${missing.join(', ')}` : required.join(' · ')
  );
}

/* ------------------------------------------------- 4. relative link targets */

const brokenLinks = [];
for (const file of LINK_CHECKED) {
  const text = readFileSync(file, 'utf8');
  for (const target of extractLinkTargets(text)) {
    if (isSkippedTarget(target)) continue;
    const bare = stripAnchor(target);
    if (!bare) continue;
    if (!existsSync(path.resolve(path.dirname(file), bare))) {
      brokenLinks.push(`${relOf(file)} → ${target}`);
    }
  }
}
assert(
  'relative markdown links resolve to existing files',
  brokenLinks.length === 0,
  brokenLinks.length
    ? `unresolved: ${brokenLinks.join('; ')}`
    : `${LINK_CHECKED.length} files checked`
);

/* ------------------------------------------- 13. anchors resolve to headings */

const brokenAnchors = [];
for (const file of LINK_CHECKED) {
  const text = readFileSync(file, 'utf8');
  for (const target of extractLinkTargets(text)) {
    if (isSkippedTarget(target)) continue;
    const hashAt = target.indexOf('#');
    if (hashAt === -1) continue;
    const bare = target.slice(0, hashAt);
    const anchor = target.slice(hashAt + 1);
    if (!bare || !anchor) continue;
    const resolved = path.resolve(path.dirname(file), bare);
    if (!resolved.endsWith('.md') || !existsSync(resolved)) continue;
    if (!headingSlugs(resolved).has(anchor)) {
      brokenAnchors.push(`${relOf(file)} → ${target} (no such heading)`);
    }
  }
}
assert(
  'markdown anchors resolve to headings in the target file',
  brokenAnchors.length === 0,
  brokenAnchors.length
    ? `broken: ${brokenAnchors.join('; ')}`
    : 'all #fragment links match a heading slug'
);

/* ------------------------------------------------ 5. docs index completeness */

const indexTargets = extractLinkTargets(read('docs/README.md'))
  .filter((t) => !isSkippedTarget(t))
  .map((t) => relOf(path.resolve(docsDir, stripAnchor(t))));
const resolvedFromIndex = new Set(indexTargets.filter(Boolean));

const unindexed = docsMd.map(relOf).filter((p) => !resolvedFromIndex.has(p));
assert(
  'docs index complete (every docs/**/*.md linked from docs/README.md)',
  unindexed.length === 0,
  unindexed.length ? `not indexed: ${unindexed.join(', ')}` : `${docsMd.length} files indexed`
);

const requiredBacklinks = ['README.md', 'ZCODE.md', 'AGENTS.md', 'apps-script/SETUP.md'];
const missingBacklinks = requiredBacklinks.filter((p) => !resolvedFromIndex.has(p));
assert(
  'docs index links README/ZCODE/AGENTS/apps-script SETUP',
  missingBacklinks.length === 0,
  missingBacklinks.length ? `missing: ${missingBacklinks.join(', ')}` : 'all four linked'
);

/* --------------------------------- 14. ZCODE.md orientation-map completeness */

const resolvedFromZcode = new Set(
  extractLinkTargets(read('ZCODE.md'))
    .filter((t) => !isSkippedTarget(t))
    .map((t) => {
      const bare = stripAnchor(t);
      return bare ? relOf(path.resolve(repoRoot, bare)) : null;
    })
    .filter(Boolean)
);
const unindexedInZcode = docsMd.map(relOf).filter((p) => !resolvedFromZcode.has(p));
assert(
  'ZCODE.md orientation map covers every doc under docs/',
  unindexedInZcode.length === 0,
  unindexedInZcode.length
    ? `not in the map: ${unindexedInZcode.join(', ')}`
    : `${docsMd.length} files routed`
);

/* ------------------------------------------------- 6. npm run script tokens */

const pkg = JSON.parse(read('package.json'));
const scriptNames = new Set(Object.keys(pkg.scripts || {}));
const unknownRuns = [];
// docs/research/ is verbatim historical research quoting third-party repos'
// commands — not references to this repo's scripts (see header).
const NPM_CHECKED = LINK_CHECKED.filter(
  (f) => !relOf(f).startsWith('docs/research/')
);
for (const file of NPM_CHECKED) {
  for (const m of readFileSync(file, 'utf8').matchAll(/npm run ([a-z][a-z0-9:-]*)/g)) {
    if (!scriptNames.has(m[1])) unknownRuns.push(`${relOf(file)}: npm run ${m[1]}`);
  }
}
assert(
  'npm run references in link-checked docs exist in package.json',
  unknownRuns.length === 0,
  unknownRuns.length ? `unknown: ${unknownRuns.join('; ')}` : `${NPM_CHECKED.length} files walked (docs/research/ excluded)`
);

/* ------------------------------------------------------------ 7. gate wiring */

assert(
  "package.json wires check:docs to 'node scripts/check-docs.mjs'",
  pkg.scripts?.['check:docs'] === 'node scripts/check-docs.mjs',
  `scripts.check:docs = ${pkg.scripts?.['check:docs'] ?? '(absent)'}`
);
const checkYml = read(path.join('.github', 'workflows', 'check.yml'));
assert('check.yml runs the docs gate', checkYml.includes('check:docs'));

/* ------------------------------------------------------------ 8. size budgets */

const agentsLines = read('AGENTS.md').split('\n').length;
assert('AGENTS.md within 80-line budget', agentsLines <= 80, `${agentsLines} lines`);
const zcodeLines = read('ZCODE.md').split('\n').length;
assert('ZCODE.md within 400-line budget', zcodeLines <= 400, `${zcodeLines} lines`);

/* --------------------------------------------------------- 9. ADR integrity */

const decisions = read('docs/decisions.md');
const adrHeadings = [...decisions.matchAll(/^## ADR-(\d{4}): .+$/gm)].map((m) => m[0]);
assert(
  'decisions.md carries at least 7 ADRs',
  adrHeadings.length >= 7,
  `${adrHeadings.length} ADR heading(s)`
);

const adrLineRe =
  /^## ADR-(\d{4}): .+ \(\d{4}-\d{2}-\d{2}, (accepted|rejected|superseded by ADR-\d{4})[^)]*\)$/;
const malformedAdrs = adrHeadings.filter((l) => !adrLineRe.test(l));
assert(
  'every ADR heading has date + status in the strict format',
  malformedAdrs.length === 0,
  malformedAdrs.length ? malformedAdrs.join(' | ') : 'all headings well-formed'
);

const adrNumbers = [...decisions.matchAll(/^## ADR-(\d{4}): /gm)].map((m) => Number(m[1]));
assert(
  'ADR numbers are exactly 0001..N in file order',
  adrNumbers.length === adrHeadings.length &&
    adrNumbers.every((n, i) => n === i + 1),
  adrNumbers.join(',')
);

const countOf = (re) => (decisions.match(re) || []).length;
const nCtx = countOf(/^### Context/gm);
const nDec = countOf(/^### Decision/gm);
const nCon = countOf(/^### Consequences/gm);
assert(
  'each ADR has exactly one Context/Decision/Consequences',
  nCtx === adrHeadings.length && nDec === adrHeadings.length && nCon === adrHeadings.length,
  `Context ${nCtx} · Decision ${nDec} · Consequences ${nCon} vs ${adrHeadings.length} ADRs`
);

/* ------------------------------------------------- 10. improvement-log format */

const log = read('docs/ai/improvement-log.md');
assert(
  'improvement log carries the append-only marker',
  log.includes('Append-only: never edit or delete past entries.')
);
const logDates = [...log.matchAll(/^## (\d{4}-\d{2}-\d{2}) — /gm)].map((m) => m[1]);
assert(
  'improvement log has at least one dated entry',
  logDates.length >= 1,
  `${logDates.length} entr${logDates.length === 1 ? 'y' : 'ies'}`
);
const nonDecreasing = logDates.every((d, i) => i === 0 || d >= logDates[i - 1]);
assert(
  'improvement-log dates are non-decreasing',
  nonDecreasing,
  logDates.join(' → ')
);

/* ------------------------------------------------------- 11. README pointer */

const readmePointsToIndex = extractLinkTargets(read('README.md')).some((t) => {
  if (isSkippedTarget(t)) return false;
  const bare = stripAnchor(t);
  return Boolean(bare) && relOf(path.resolve(repoRoot, bare)) === 'docs/README.md';
});
assert('README.md links the docs index (docs/README.md)', readmePointsToIndex);

/* ----------------------------------------- 12. no machine-local /home/ paths */

const homeOffenders = GATED_DOCS.filter((f) => read(f).includes('/home/'));
assert(
  "no machine-local '/home/' paths in gated docs",
  homeOffenders.length === 0,
  homeOffenders.length ? `found in: ${homeOffenders.join(', ')}` : 'clean'
);

/* ------------------------------------- 15. AGENTS.md ↔ ZCODE.md red-line sync */

/** Collapse whitespace so phrase checks survive markdown line wrapping. */
const flat = (s) => s.replace(/\s+/g, ' ');

const SYNC_PHRASES = [
  // gates / git policy
  'without the owner (Khanh) reviewing the results first',
  'branch protection requires that exact status context',
  // ask-first + orderEndpoint ownership
  "the Sheet is the family's back office",
  'dependency or CI change',
  'pastes the /exec URL himself',
  // never-touch items
  'build output',
  'unknown provenance',
  'CSP meta in',
  'per-phone rate limit',
  'field caps, honeypot',
  // non-obvious facts
  'is:inline',
  'script.googleusercontent.com',
  '>= 22.12, never 23',
  'Nov–Feb → tet',
];
const agentsFlat = flat(read('AGENTS.md'));
const zcodeFlat = flat(read('ZCODE.md'));
const outOfSync = SYNC_PHRASES.filter(
  (p) => !agentsFlat.includes(flat(p)) || !zcodeFlat.includes(flat(p))
);
assert(
  'AGENTS.md and ZCODE.md carry the same shared red lines',
  outOfSync.length === 0,
  outOfSync.length
    ? `present in only one file: ${outOfSync.join(' | ')}`
    : `${SYNC_PHRASES.length} shared phrases in both`
);

/* ------------------------------------------------ 16. token-count integrity */

const DOCUMENTED_ROOT_TOKENS = 56;
const cssText = readFileSync(
  path.join(repoRoot, 'src', 'styles', 'global.css'),
  'utf8'
);
const rootBlock = cssText.match(/:root\s*\{([\s\S]*?)\n\}/);
const rootTokenCount = rootBlock
  ? [...rootBlock[1].matchAll(/^[ \t]*--[a-z0-9-]+\s*:/gm)].length
  : -1;
assert(
  'src/styles/global.css :root declares the documented token count',
  rootTokenCount === DOCUMENTED_ROOT_TOKENS,
  `${rootTokenCount} declared, ${DOCUMENTED_ROOT_TOKENS} documented — update the constant AND both docs together`
);
assert(
  "token count stated as '56 custom properties' in ZCODE.md and docs/architecture.md",
  flat(read('ZCODE.md')).includes('56 custom properties') &&
    flat(read('docs/architecture.md')).includes('56 custom properties')
);

/* -------------------------------------------------- 17. citation line-anchors */

const siteJsonLine16 = (readFileSync(path.join(repoRoot, 'src', 'data', 'site.json'), 'utf8').split('\n')[15] || '').trim();
assert(
  "citation anchor: site.json 'orderEndpoint' is on line 16 (as cited)",
  siteJsonLine16.startsWith('"orderEndpoint"'),
  `line 16 reads: ${siteJsonLine16}`
);
const checkYmlLine15 = (checkYml.split('\n')[14] || '').trim();
assert(
  "citation anchor: check.yml job id 'check' is on line 15 (as cited)",
  checkYmlLine15 === 'check:',
  `line 15 reads: ${checkYmlLine15}`
);

/* ------------------------------------------------ 18. citation integrity */

// Append-only records are out of scope: their citations are claims about
// the time they were written and must not be edited to track drift.
const CITATION_DOCS = [
  'AGENTS.md',
  'ZCODE.md',
  'docs/README.md',
  'docs/architecture.md',
  'docs/operations.md',
  'docs/roadmap.md',
  'docs/ai/memory-system.md',
];

const CITED_PATHS = {
  'BaseLayout.astro': 'src/layouts/BaseLayout.astro',
  'ContactForm.astro': 'src/components/ContactForm.astro',
  'Code.gs': 'apps-script/Code.gs',
  'catalog.ts': 'src/utils/catalog.ts',
  'global.css': 'src/styles/global.css',
  'site.json': 'src/data/site.json',
  'astro.config.mjs': 'astro.config.mjs',
  'SETUP.md': 'apps-script/SETUP.md',
  'README.md': 'README.md',
  'design-language.md': 'docs/design-language.md',
  'check.yml': '.github/workflows/check.yml',
  'deploy.yml': '.github/workflows/deploy.yml',
};

const CITED_FACTS = [
  // [repo path, fromLine, toLine, substring that must sit inside the range]
  ['src/layouts/BaseLayout.astro', 52, 75, 'http-equiv="Content-Security-Policy"'],
  ['src/layouts/BaseLayout.astro', 105, 173, 'is:inline'],
  ['src/layouts/BaseLayout.astro', 125, 135, 'trung-thu'],
  ['src/layouts/BaseLayout.astro', 156, 166, 'hero-tet-'],
  ['src/layouts/BaseLayout.astro', 184, 200, 'float-zalo'],
  ['src/components/ContactForm.astro', 24, 24, 'maxlength="100"'],
  ['src/components/ContactForm.astro', 61, 61, 'maxlength="1000"'],
  ['src/components/ContactForm.astro', 138, 143, 'ENDPOINT_CONFIGURED'],
  ['src/components/ContactForm.astro', 148, 153, 'no-cors'],
  ['apps-script/Code.gs', 51, 56, 'clip('],
  ['apps-script/Code.gs', 59, 59, 'invalid name or phone'],
  ['apps-script/Code.gs', 62, 64, 'company'],
  ['apps-script/Code.gs', 71, 76, 'too many requests'],
  ['apps-script/Code.gs', 94, 98, 'neutralize('],
  ['apps-script/Code.gs', 110, 112, 'doGet'],
  ['apps-script/Code.gs', 147, 160, 'LockService'],
  ['apps-script/Code.gs', 163, 179, 'findRecentDuplicate'],
  ['apps-script/Code.gs', 190, 193, 'function neutralize'],
  ['astro.config.mjs', 13, 16, 'defineConfig'],
  ['astro.config.mjs', 14, 14, 'fropppy.github.io'],
  ['src/utils/catalog.ts', 5, 13, 'Medusa'],
  ['README.md', 29, 29, 'site.json'],
  ['README.md', 32, 32, 'fropppy.github.io'],
  ['apps-script/SETUP.md', 17, 19, 'Anyone'],
  ['src/data/site.json', 6, 10, 'zaloUrl'],
  ['docs/design-language.md', 3, 3, 'implemented'],
  ['.github/workflows/check.yml', 23, 23, 'actions/setup-node'],
];

const fileLinesCache = new Map();
const linesOf = (rel) => {
  if (!fileLinesCache.has(rel)) {
    fileLinesCache.set(
      rel,
      existsSync(path.join(repoRoot, rel))
        ? readFileSync(path.join(repoRoot, rel), 'utf8').split('\n')
        : null
    );
  }
  return fileLinesCache.get(rel);
};

// Mechanical: every file.ext:line[-line] citation resolves and is in range.
const citationRe =
  /([\w./-]+\.(?:astro|gs|ts|js|mjs|cjs|json|css|yml|yaml|md)):(\d+)(?:-(\d+))?/g;
const badCitations = [];
for (const doc of CITATION_DOCS) {
  for (const m of read(doc).matchAll(citationRe)) {
    const name = m[1];
    const rel = name.includes('/') ? name : CITED_PATHS[name];
    if (!rel) {
      badCitations.push(`${doc}: '${name}' has no path mapping`);
      continue;
    }
    const lines = linesOf(rel);
    if (!lines) {
      badCitations.push(`${doc} → ${name}: file not found at ${rel}`);
      continue;
    }
    const from = Number(m[2]);
    const to = Number(m[3] || m[2]);
    if (from < 1 || to > lines.length) {
      badCitations.push(`${doc} → ${m[0]}: lines ${from}-${to} outside ${rel} (${lines.length} lines)`);
    }
  }
}
assert(
  'file:line citations in living docs resolve and stay in range',
  badCitations.length === 0,
  badCitations.length ? badCitations.join('; ') : 'all citations in bounds'
);

// Semantic: the load-bearing content still sits inside each cited range.
const staleFacts = [];
for (const [rel, from, to, expect] of CITED_FACTS) {
  const lines = linesOf(rel);
  const slice = lines ? lines.slice(from - 1, to).join('\n') : '';
  if (!lines || !slice.includes(expect)) {
    staleFacts.push(`${rel}:${from}-${to} no longer contains '${expect}'`);
  }
}
assert(
  'cited content still sits at the cited ranges',
  staleFacts.length === 0,
  staleFacts.length ? staleFacts.join('; ') : `${CITED_FACTS.length} pinned facts verified`
);

/* -------------------------------------------------------------------- summary */

console.log(
  `\ncheck-docs: ${GATED_DOCS.length} gated docs, ${LINK_CHECKED.length} link-checked markdown files`
);
if (failures.length > 0) {
  console.error(`\ncheck-docs: ${failures.length} assertion(s) failed:`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('check-docs: all assertions pass.');
