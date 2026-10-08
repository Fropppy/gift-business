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

- Decide the fate of gift-business-site.zip (unknown provenance,
  gitignored) — delete or archive outside the repo. Owner's manual call;
  agents must not touch it.

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
- 2026-10-08: stale-cleanup sweep — README placeholder table now matches
  reality (astro.config row says "already correct"; dead ContactForm /
  Testimonials rows removed; check-docs README pins updated to the new
  rows, same assertion count); design-language §4.2 hero-fit row repinned
  to the real floor (`.hero-title` global.css:608 — the old 1.6rem pins
  were dead lines in `.header-hotline`); theme switcher label "Mùa
  (auto)" → "Tự động" (pure Vietnamese, ThemeSwitcher.astro + §2.4/§2.7
  prose); operations.md note updated to match the corrected README.
  Still open in the owner's untracked seo-proposal.md: the stale
  gate-status paragraph at :72-79.
- 2026-10-08: "Mai Almanac" editorial re-style + zero-JS motion layer —
  the 2026 redesign pass, run as a three-workflow pipeline (concept
  battle across junior/mid/senior engineers → synthesized spec; build
  with planner/critic + per-file diff review + confirmers; three-lens
  independent audit + fix rounds). Shipped as global.css value-swaps and
  appends past :1503 only (the region contract held — 27 CITED_FACTS
  pins and the living `.hero-title` citation at global.css:608
  untouched)
  plus ONE line at BaseLayout.astro:102 (Playfair URL → variable range
  0,400..900;1,400..700 on the same origin; Be Vietnam Pro segment
  byte-identical). 13-motion CSS layer: scroll-driven view() entrances,
  variable-font settles, hover turns — all inside
  prefers-reduced-motion: no-preference AND @supports guards, animated
  properties transform/opacity/font-variation-settings only, hardened
  with an animation-timeline: auto reduce-block against the existing
  duration kill. Zero color values moved, tet/trung-thu blocks
  byte-identical, zero new JavaScript or dependencies, design record in
  design-language.md §10 + ADR-0009. Audit caught and fixed before
  ship: five animation-range ends were bare percentages (COVER-relative,
  not entry-relative — now entry-relative ends) and roof-draw had no
  range so cover-100% was unreachable at max scroll (live-measured
  part-draw; fixed). Browser QA this session: 1280px (hero 92.8px,
  rail drop 56px, roofline scaleX(1) at max scroll, step numeral
  settles wght 680), 390px (hero 39.4px / 4 lines, lead card stacks as
  a standard card, occasion peek intact, no horizontal overflow), PDP
  under tet theme (folio price 32px + settle, ruled story rail,
  clipped parallax). Not live-tested: prefers-reduced-motion emulation
  (in-app browser lacks it) — verified structurally by the audit. All
  four gates green this session by the release step, not by inference.
