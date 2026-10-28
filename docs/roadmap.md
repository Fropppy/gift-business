# Roadmap

Status vocabulary: **Now** = pending owner action, blocked on Khanh.
**Next** = small unblocked fixes an agent can do. **Later** = conditional —
revisit only when its trigger fires. **Done** = completed (append here so
Now/Later stay honest).

## Now

- Monitoring: create the daily 07:00 digest automation — one-line ask in a
  fresh ZCode chat, prompt pinned in monitoring.md (the host allows one
  scheduled task per session and this repo's session already owns the
  Friday weekly). Then StatusCake free signup + test-fire and residual-risk
  sign-off (monitoring.md → Fast lane / Residual risks).
- Review-merge Dependabot PR #8 (actions/setup-node 7.0.0 → 7.1.0) — a CI
  change, owner's call.
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

- 2026-10-17: monitoring system — four-angle research distilled from the
  machine-local `out/monitoring-proposal.md` into the repo-owned
  docs/monitoring.md (digest checklist with the automation prompt pinned
  1:1, canonical do-not-alarm list, alert flow, residual risks); same-day
  dry run all-green (out/daily/2026-10-17.md). The automation itself is
  pending creation in a fresh chat — the host allows one scheduled task per
  session and the Friday weekly owns this session's slot (see Now).
  Gates: all four run green in this change's verification step.
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
- 2026-10-17: minimal-lane component pass — boxed → floating across every
  repeated surface, built as five waves from the owner-approved
  minimal-component proposal (all three Wave-5 sign-off trades included:
  hero band one-action, card descriptions off, ruled-paper CTA band).
  Float: cards / hero tile / PDP plate / header bar lose their defining
  borders for cocoa-ink shadow lifts (global.css:1873-1898) and the
  desktop Zalo CTA floats ≥901px (global.css:1909-1912). Type: card
  names 1.18rem (global.css:1936-1939), lead-card display clamp ≥700px
  (global.css:1949-1957), proof-band facts to Playfair display size
  (global.css:1970-1976), current-crumb + accent PDP eyebrow
  (global.css:1990-1992), wordmark 1.5rem with a measured ≤560px
  1.35rem mobile tier (global.css:2004-2006) and scroll-padding-top
  re-measured to 4.75rem. Ruled bands: Steps/Commitments de-boxed to
  ruled entries (global.css:2035-2059); submit :disabled state +
  channel folio color flip (global.css:2070-2085). Markup: PDP options
  folded in as the 4th story-facts row (src/pages/products/[slug].astro:150-154)
  with .meta-list a rail twin (global.css:2115-2124) and the de-inlined
  right column (global.css:2143-2156); catalog empty states get real
  anchors (src/components/ProductGrid.astro:118-125 +
  global.css:2173-2182); search
  focus joins the form grammar (global.css:2198-2200); borderless
  filter chips via the two-rule :where() append (global.css:2227-2229).
  Sign-off wave: one link-more hero-band action
  (src/components/Hero.astro:57-61), a
  static hand-drawn stroke under "chu đáo" (src/components/Hero.astro:15,
  global.css:2282-2294), .card-desc off catalog cards at all widths
  (dead rules stay above :1503), CTA band → ruled paper + roofline
  with the focus ring re-pointed to --primary (src/components/CTA.astro:19-30,
  global.css:2306-2350) and the check-contrast band comment synced in
  the same commit (comment-only, no bar change). Region contract held:
  global.css lines 1-1502 count-stable (nine swap hunks, enumerated in
  the design record), appends only at the file end; :root untouched
  (56 tokens), tet/trung-thu byte-identical, §10's 13-row motion
  inventory untouched (stroke static; new states instant). Design
  record: docs/design-language.md §11 plus its §10 Wave-4 addendum.
  Shipped: 8013b5a → PR #9 (CI green on headSha) → merge a0bf373 → Pages
  deploy verified; live: hero-stroke present, .card-desc gone, floating
  CSS served; QA 1280/390/320+tet (chips 44px, stroke clear); gates green.

- 2026-10-28: SEO suite (seo-proposal P0-4/P0-5/P0-7 + P1-1/P1-2) shipped as
  one commit — three category landing pages at /danh-muc/ (Tết 8 products,
  khai trương–tân gia 2, doanh nghiệp 4) built by getStaticPaths with unique
  Vietnamese copy, ItemList + BreadcrumbList JSON-LD, canonical/og:url free
  from BaseLayout (src/pages/danh-muc/[slug].astro); internal links repointed
  (CategoryGrid 3 cards, hero-band CTA, Footer 2 deep links, tet +
  khai-trương occasion chips, PDP breadcrumb/eyebrow/occasion links;
  non-landing categories keep the ?category= filter views, no noindex);
  sitewide og:image og-default-v1.png (1200×630 PNG, 84 KB — under Zalo's
  1.39 MB preview cap) + og:image:width/height/alt + twitter:card in a
  6-for-6 swap at src/layouts/BaseLayout.astro:84-89 (net line delta 0, zero
  CITED_FACTS bumps); Hero tile h3→h2 at src/components/Hero.astro:29 with
  one compensating append at src/styles/global.css:2351-2363 (region
  contract held, :root still 56 tokens); site.json:4 description now carries
  "giao nhanh trong ngày tại TP. HCM"; fetchpriority="high" on the PDP LCP
  img; sitemap 20→23 URLs in lockstep — scripts/generate-sitemap.mjs and
  scripts/check-output.mjs route lists extended in the same commit — plus a
  NEW check-output assertion pinning the og/twitter tags on every page;
  ADR-0010 (docs/decisions.md) records the route scheme + versioned
  og:image. Lighthouse 13.6.0 mobile lab runs on the local preview (JSONs
  in out/seo-suite/lighthouse/, untracked): PDP 90→90 with LCP 3.4→3.3 s
  and lcp-discovery fixed by fetchpriority; the three landing pages score
  91/91/91; home heading-order fixed (the P0-4 target). Home perf read 98
  before vs 94 after, but four identical after-runs spanned 86–95 with TBT
  170–520 ms and total scripting ~36 ms — host-load noise (load average
  1.4–1.6 during the runs), recorded per the spec's
  investigate-and-record guard, not a code regression. Accepted open (audit
  §1 scope flag): /products/ and /contact/ card h1→h3 skips remain
  (Lighthouse heading-order still fails on /products/). Browser QA 390px +
  1280px: tile heading computed 19.2px/margin 0 after the swap, 8/2/4
  cards, no horizontal overflow anywhere, tet theme applies on the landing
  pages. All four gates green in this task's verification step.
