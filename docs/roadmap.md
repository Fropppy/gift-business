# Roadmap

Status vocabulary: **Now** = pending owner action, blocked on Khanh.
**Next** = small unblocked fixes an agent can do. **Later** = conditional —
revisit only when its trigger fires. **Done** = completed (append here so
Now/Later stay honest).

## Now

- Deploy the Apps Script and set `orderEndpoint` (unblocks real orders; full
  path in operations.md → Go-live checklist).
- Replace placeholder content that is LIVE on the public site today: sample
  hotline 0900 123 456, sample Zalo/Facebook links (site.json:6-10), 17
  placeholder product SVGs + hero art (see operations.md → Replacing
  placeholder content).

## Next

- Fix the stale README.md:29 row — it tells the reader to replace a site URL
  that astro.config.mjs:14 already has correct; the whole placeholder table
  needs the corrected version now in operations.md.
- Decide the fate of gift-business-site.zip (unknown provenance,
  gitignored) — delete or archive outside the repo.
- Clean the two low review findings left open by the 2026-10-07 pass:
  design-language.md:347 still pins global.css:500/427 (dead lines, inside
  .header-hotline both then and now); the theme switcher label "Mùa
  (auto)" mixes English into Vietnamese UI copy.

## Later

- Medusa migration — ONLY if the ADR-0001 trigger fires (manual order
  handling breaks, or customers demand online payment).
- Site llms.txt — only if agent-facing public content appears (the
  storefront has none).
- Additional themes beyond base/tet/trung-thu — ask-first zone.
- A dedicated secret scanner (gitleaks/trufflehog) if one becomes
  available; until then the ad-hoc pattern grep in ZCODE.md Commands is the
  scan.
- An Apps Script test harness if order volume justifies it.

## Done

- 2026-10-06: `.card-zalo` tap target raised to a 24px floor on
  hover-pointer viewports (global.css base rule; touch devices already
  had the 44px §8.3 pill) — closes the WCAG 2.5.8 flag from the
  mobile-pass audit; all four gates green.

- 2026-10-06: documentation + memory system built (AGENTS.md, ZCODE.md,
  docs tree, ADR-0001..0007 backfilled); `npm run check:docs` gate added to
  the required CI context.
- 2026-10-06: platform research promoted verbatim from untracked out/ to
  docs/research/ecommerce-platform-research.md — ADR-0001's evidence is
  now tracked in git, no longer machine-local.
- 2026-10-06: mobile-first UX pass — sticky compact header, bottom
  quick-access bar (home / catalog / Zalo / call / order form), safe-area
  padding, skip link, tap-target floor in global.css; designed from VN
  mobile-commerce research + yvesrocher.vn patterns (docs/design-language.md
  §8), all four gates green. design-language.md flipped to implemented.
- 2026-10-06: dependabot PR #1 resolved — setup-node pin bumped to the
  v7.0.0 SHA (820762786026740c76f36085b0efc47a31fe5020) in check.yml;
  dependabot PR closed in favor of the manual pin.
- 2026-10-07: catalog occasion filter + quiet-luxury type pass + PDP story
  facts. /products/ gains a server-rendered "Dịp tặng" chip row (all 12
  occasions from occasions.json, no client cap) above the category row;
  ?tag= deep links now land on a lit chip with one-tap clear, and setting
  a tag replaces ?category= in URL and filter state together. Type pass:
  display/2xl/xl scale caps raised, text-wrap: balance on headlines,
  airier section spacing, display-serif PDP price — value-only edits, no
  new tokens or fonts. PDP "Gồm N món trong giỏ" list became a story-facts
  panel (Tặng ai · Dịp nào · Bên trong giỏ) built entirely from existing
  product fields; review fold-in: the standalone subtitle line under the h1
  was removed — it had rendered twice on every PDP (also under the new
  "Tặng ai" row). Design record: docs/design-language.md §9. Gates: the
  four repo gates run in this task's verification step immediately after
  these edits — that step's output is the verdict, not this line. 390px
  fit: hero rendering unchanged by construction (clamp floor/rate
  untouched, ≈39.4px); longest PDP name floor moved 30.4→32px — browser
  spot-check still owed (no renderer in the edit step).
  Spot-check and ship (2026-10-08): browser pass at 390px + 1280px
  confirmed the 32px floor, story-block geometry, occasion carousel
  snap (peek ≠ clip — rect-verified) and Playfair actually loading;
  shipped in PR #5 (merge ac122aa), live site verified, owner approved.
  Correction: Playfair was NOT added by this pass — the Google Fonts
  link has carried it since b1a1278; the pass only assigned it.
