# Operations runbook

Repeated procedures as steps with verification. Audience is Khanh (English);
the family-facing webhook setup stays Vietnamese in
[apps-script/SETUP.md](../apps-script/SETUP.md).

## Go-live checklist (pending)

Everything needed to turn the placeholder site into the real shop:

1. Deploy the Apps Script per [SETUP.md](../apps-script/SETUP.md) §1-2
   (~15 min): create the Sheet, paste Code.gs, run `setupSheets`, deploy the
   web app, copy the `/exec` URL.
2. Paste the `/exec` URL into `src/data/site.json` → `orderEndpoint`
   (line 16). This is the ONE file step the owner does himself — it lifts
   the honesty gate and the real submit path activates automatically
   (ContactForm.astro:138-143). No code change needed.
3. Replace the placeholder contact data and photos per the table below.
4. Verify: the live form submits and a test row appears in "Đơn hàng"
   (SETUP.md §2 has the curl), plus a `GET` on the `/exec` URL returns `ok`
   (Code.gs doGet, line 153-155).

## Replacing placeholder content

The placeholder table below is the detailed version; README.md carries a
short copy of it. README's rows were corrected 2026-10-08 — the stale
"set your site URL" row (astro.config.mjs was already right) and the
ContactForm/Testimonials rows (the endpoint moved to site.json and the
invented testimonials were deleted long before) are gone from README:

| Vị trí | Cần thay |
| --- | --- |
| `src/data/site.json` | `phoneDisplay`/`phoneHref`, `zaloUrl`, `facebookUrl`, `messengerUrl` (lines 6-10) are samples; check `hours`, `deliveryArea`, `replyWithin` too. `orderEndpoint` is the go-live step above. |
| `public/images/products/*.svg` | 17 placeholder SVGs → real photos with the same basename as `.jpg`/`.avif`, then update `images[]` in `src/data/products.json`. |
| `public/images/hero-*.svg` | Hero art `hero-1/2/tile.svg` → photos of real baskets, same basenames. For Tết: drop `hero-tet-1.svg`, `hero-tet-2.svg`, `hero-tet-tile.svg` into public/images/ and the Tết hero activates by itself (BaseLayout.astro:156-166 probes for the files) — no code changes. |
| `astro.config.mjs` | Nothing — `site: 'https://fropppy.github.io'` (line 14) is already correct for this repo. Change only if the repo moves. |

Regenerate placeholder art any time: `npm run generate:placeholders`.

Placeholder contact data is intentionally LIVE on the public site today
(sample hotline 0900 123 456) — it is swapped by the owner, not by agents.

## Orders

Triage runbook for "orders stopped arriving", in order:

1. **Honesty gate:** is `src/data/site.json` `orderEndpoint` still `""`? Then
   nothing was ever sent — that is the gate working. Complete the go-live
   checklist above.
2. **Deploy state:** `GET` the `/exec` URL — it must return `ok`
   (SETUP.md §2). If not, the Apps Script or its authorization is broken;
   redeploy per the section below.
3. **Rate limit:** more than 3 submissions from one phone in 10 minutes,
   or more than 50 across all phones in a day (spam guard), get
   `too many requests` — by design (Code.gs:78-96).
4. **Dedupe:** the same phone + message within 5 minutes is silently merged
   into the existing order ID (Code.gs:113-116, 228-245) — not data loss.
5. **Honeypot:** submissions with the hidden `company` field filled get a
   fake success and no row — by design (Code.gs:73-76).

The Sheet is the family's back office: schema changes (columns, dropdown
values) are breaking for their workflow — ask first and update SETUP.md in
the same PR.

## Redeploy the Apps Script without a new URL

SETUP.md §4 in one line: **Deploy → Manage deployments → ✎ (edit) → Version:
New version → Deploy.** The `/exec` URL never changes; a "New deployment"
would mint a new one. Warning: editing Code.gs does nothing live until a new
version is deployed — the old code keeps serving.

## Release flow

develop → push → PR (the required `check` context runs all four gates,
including `npm run check:docs`) → merge → deploy.yml builds and publishes on
main. Node >= 22.12, never 23. If deploy fails on a fresh clone, check repo
Settings → Pages → Source = "GitHub Actions" — a one-time toggle that leaves
no file trace. Never push without the owner reviewing results first.

## Rollback the site

For "deploy finished but the content is wrong". Honest framing: Pages
deployed from GitHub Actions has no one-click "restore previous artifact" —
rollback IS a fresh deploy of reverted code, and its cost is one build cycle
(~minutes) of bad content staying live.

1. **Find the last-good deployment** — the `github-pages` environment's
   deployment history (every publish by the deploy job's `environment:`
   block lands there) or the deploy workflow's Actions run list.
2. **Revert-forward** — `git revert <bad-sha>` on develop → normal PR to
   main. Force pushes are off and admins are not exempt, so a forward
   revert through the required `check` context is the only path; with zero
   required reviews the solo owner merges it immediately. The merge itself
   fires deploy.yml's push-to-main trigger: the reverted, last-good code is
   rebuilt and published.
3. **Run merely failed or cancelled on current main?** Nothing to revert —
   re-dispatch `gh workflow run deploy.yml` (its `workflow_dispatch`
   trigger; the same remediation [monitoring.md](monitoring.md) § Alert
   flow already sanctions).

Verify: the live URL serves the pre-bad content (hard-refresh past the CDN
cache) and the newest deploy run's head commit is the revert merge.

## Docs & memory upkeep

The rituals (same-PR doc updates, improvement-log appends, personal-memory
pruning) live in [ai/memory-system.md](ai/memory-system.md).
