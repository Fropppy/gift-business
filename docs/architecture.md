# Architecture

What the system IS. For why it is this way, see [decisions.md](decisions.md);
for how to operate it, [operations.md](operations.md).

## Site

Static Astro 7 (`astro ^7.3.5` — the sole dependency in package.json; no
adapter, pure static output, `astro.config.mjs:13-16`). `npm run build`
emits 21 pages into dist/. There is no JS framework and no server.

- `src/layouts/BaseLayout.astro` — theme engine + CSP meta + the Zalo/hotline
  floating button (BaseLayout.astro:144-160) on every page.
- `src/components/ContactForm.astro` — the enquiry form incl. the honesty
  gate.
- Data layer: `src/data/products.json` (16 products across 7 category
  slugs), `occasions.json` (12), `categories.json` (7). Product shape follows
  the Medusa model — slug→handle, name→title, `price` is a Pricing-Module
  record `{ "amount": 850000, "currency_code": "vnd" }`
  (`src/utils/catalog.ts:5-13`).
- `src/data/site.json` is the single placeholder surface: sample
  phone/Zalo/Facebook (lines 6-10), hours/delivery area, and
  `orderEndpoint: ""` (line 16). Owner-editable by design.
- `src/styles/global.css` — token system: `:root` declares 56 custom
  properties; `[data-theme='tet']` and `[data-theme='trung-thu']` each
  override 12.
- `src/utils/asset.ts` — prefixes public URLs with `/gift-business` for the
  GitHub Pages base path.

## Theme engine

`data-theme` on `<html>`, whitelist base/tet/trung-thu. Calendar auto:
Nov–Feb → tet, Sep → trung-thu (a documented Gregorian approximation of
rằm tháng 8 that occasionally falls in early October). localStorage
`nm:theme` manual override, validated against the whitelist. All of this
lives in the `is:inline` synchronous head script (BaseLayout.astro:66-134)
and must stay inline — a bundled/module script executes after first paint
and would flash the wrong palette. The switcher is revealed via
`data-theme-ui`; dist/ behavior is asserted by scripts/check-output.mjs.
When the effective theme is tet and `hero-tet-*.svg` files exist, the hero
tokens swap to them automatically (BaseLayout.astro:117-127).

## Order pipeline

ContactForm POSTs JSON (`mode: 'no-cors'`, ContactForm.astro:148-153) → the
Apps Script Web App (apps-script/Code.gs) → a Google Sheet that IS the
family's back office. While `site.json` `orderEndpoint` is `""`, the form
runs its honesty gate: it refuses to promise delivery and shows the
Zalo/hotline fallback instead (ContactForm.astro:138-143). Setup:
[SETUP.md](../apps-script/SETUP.md). Operations: [operations.md](operations.md#orders).

Defenses in the webhook (apps-script/Code.gs), one sentence each:

- **Honeypot** — a filled hidden `company` field is silently dropped with a
  fake success response (Code.gs:62-64).
- **Formula-injection neutralize()** — any value starting with `= + - @` or
  tab/CR is stored as text via a leading apostrophe, applied to every
  appended field (Code.gs:190-193, applied at Code.gs:94-98).
- **Per-phone rate limit** — max 3 submissions per 10 min via CacheService,
  checked BEFORE any sheet access (Code.gs:71-76).
- **Field caps** — name 100 / product 200 / message 1000 / page 500 chars
  (Code.gs:51-56), with matching maxlength on the form
  (ContactForm.astro:24,61).
- **Constant error strings** — `'invalid name or phone'` / `'too many
  requests'`, no detail leakage (Code.gs:59,74).

Plus: order IDs `GQ-YYYYMMDD-####` (LockService-raced, Code.gs:147-160) and
5-minute same-phone+message dedupe (Code.gs:163-179). The endpoint is
no-auth by design ("Who has access: Anyone", SETUP.md:17-19) and defended
in depth; the browser never reads responses (no-cors).

## Build, CI/CD

Four deterministic gates, in order: `npm run check:docs` →
`npm run check:contrast` → `npm run build` → `npm run check:output`
(check:output asserts against dist/, so it must run after build; the full
chain also runs in CI).

- check.yml (pull_request + workflow_dispatch) runs all four gates under
  Node 22. Its job id is `check` (.github/workflows/check.yml:15) — that
  exact status context is required by main's branch protection (PR required,
  strict, admins included; verified via gh api). Renaming the job id breaks
  the required check on main.
- deploy.yml runs on push to main: withastro/action (SHA-pinned # v6) does
  install + build + artifact upload in one step, then actions/deploy-pages
  (# v5) publishes. PR checks are a separate workflow because
  withastro/action cannot run custom scripts.
- All action refs are pinned to commit SHAs; dependabot
  (.github/dependabot.yml) opens weekly bump PRs for github-actions.
- Node >= 22.12, never 23 (Astro 7 — pinned in both workflows).

## Security posture

CSP meta on every page (BaseLayout.astro:44-47; asserted on 21/21 dist/
pages by check-output.mjs): `default-src 'none'`, and `connect-src`
allow-lists BOTH https://script.google.com AND
https://script.googleusercontent.com — the Apps Script /exec URL answers
with a 302 to a one-time script.googleusercontent.com URL and CSP is
enforced on every redirect hop (commit 8c2af58). Known limitation,
documented in-source: script-src carries 'unsafe-inline' because the theme
engine must stay inline and Astro inlines bundles — this CSP blocks remote
code/exfil origins, not inline XSS (BaseLayout.astro:24-43).

Secret scan: the ad-hoc pattern grep in ZCODE.md (Commands) over every blob
in history — GitHub token prefixes (ghp_/gho_/ghs_/github_pat_), AWS
AKIA/ASIA, Google AIza, Slack xox*, Stripe sk_live_/sk_test_, npm_, and
PEM blocks via the literal `PRIVATE KEY`; pathspec excludes skip the three
files that quote the pattern (ZCODE.md, this file, the improvement log) so
the scanner never reports its own documentation. Two caveats: coverage is
exactly that pattern list — it is not a dedicated scanner (gitleaks/
trufflehog not installed; see roadmap.md) — and the command's `--` must
stay AFTER the rev list (before it, git parses the SHAs as pathspecs and
the scan silently searches nothing). Zero hits when last run with the
working form, 2026-10-06.

## Known limitations

- Apps Script runs only in Google's runtime — no test harness, nothing in
  CI covers it; its behavior is verified by reading Code.gs, not by running
  it.
- The one-time Pages→GitHub Actions source toggle (repo Settings → Pages)
  leaves no file trace in the repo — verify in Settings if deploys fail on a
  fresh clone.
- dist/ is build output and gift-business-site.zip is an artifact of unknown
  provenance; neither is source.
