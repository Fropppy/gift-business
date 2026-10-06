# gift-business — agent instructions

Nhà Mai: a static Astro 7 gift-basket catalog for a family shop, deployed to
GitHub Pages (https://fropppy.github.io/gift-business/). Orders are handled
manually via Zalo/hotline and a Google Sheet — no cart, no payments, no unit
tests. Verification is the gate scripts below plus CI job "check".

## Read first

Read [ZCODE.md](ZCODE.md) before any work in this repo. Then, when relevant:

- [docs/README.md](docs/README.md) — index of all documentation.
- [apps-script/SETUP.md](apps-script/SETUP.md) — before touching apps-script/Code.gs.
- [docs/design-language.md](docs/design-language.md) — before touching themes or tokens.

## Gates

Run ALL four before declaring any task done. `npm run check:output` runs AFTER
`npm run build` (it asserts against dist/):

- `npm run build`
- `npm run check:contrast`
- `npm run check:output`
- `npm run check:docs`

There is no unit-test suite — these scripts plus CI job "check" are the whole
gate. A gate not run this session is reported as not run, never as passed.
Never weaken a gate to make it pass: fix the code or the doc. Editing
scripts/check-*.mjs to lower the bar, or renaming check.yml's job id `check`
(branch protection requires that exact status context), is forbidden.

## Git

- Work happens on develop. main is protected: PR + required `check` status
  context, strict, admins included. Inspect via
  `gh api repos/Fropppy/gift-business/branches/main/protection`.
- Conventional Commits, matching git log: `fix(frontend):`,
  `fix(apps-script):`, `docs:`, `chore(ci):` …
- Never push without the owner (Khanh) reviewing the results first. Commit
  locally on develop and wait.

## Never touch

- `dist/` — build output.
- `gift-business-site.zip` — unknown provenance.
- `src/data/site.json` `orderEndpoint` — the owner deploys the Apps Script and
  pastes the /exec URL himself. While it is `""` the contact form runs its
  honesty-gate branch on purpose; that is not a bug.
- The CSP meta in `src/layouts/BaseLayout.astro`.
- The Apps Script defenses in `apps-script/Code.gs`: formula-injection
  neutralize(), per-phone rate limit, field caps, honeypot
  (commits d354992, 59b4887, 60aa4d9).

## Ask first

- New themes beyond base / tet / trung-thu.
- Google Sheet schema changes — the Sheet is the family's back office.
- Any new dependency or CI change.

## Non-obvious facts

- The FOUC-safe theme script must stay `is:inline` inside <head>; bundling it
  breaks the no-flash palette.
- CSP `connect-src` allow-lists BOTH script.google.com and
  script.googleusercontent.com (the Apps Script 302 hop, commit 8c2af58);
  dropping the second origin breaks every order submit once the webhook is
  live.
- Node >= 22.12, never 23 (Astro 7 — see deploy.yml).
- Theme calendar: Nov–Feb → tet; Sep → trung-thu (a Gregorian approximation
  of rằm tháng 8); localStorage `nm:theme` overrides.
- Placeholder contact data is intentionally live on the public site until the
  owner replaces it — see docs/operations.md.
