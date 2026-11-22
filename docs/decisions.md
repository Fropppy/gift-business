# Decision log

MADR-lite, backfilled on 2026-10-06 — most entries are retroactive records of
decisions already shipped (the "why" previously lived in untracked research
files and agent memory). Decisions are append-only: never edit an accepted
ADR; supersede it by writing a new ADR that links the old one. Rationale is
the point — a decision without its "why" cannot be re-evaluated.

## How to add a decision

Append, at the end of the file:

```text
  ## ADR-NNNN: Title (YYYY-MM-DD, accepted)
  ### Context
  The forces at play — what constrained the choice.
  ### Decision
  What we chose, in one or two sentences.
  ### Consequences
  What becomes true/false because of it, including costs and revisit triggers.
```

- Numbers are sequential from 0001, never reused, no gaps.
- Status is `accepted`, `rejected`, or `superseded by ADR-MMMM` (with the
  superseding number).
- Only architecturally significant, hard-to-reverse choices get an ADR —
  not every refactor.
- The heading format, the three subsections, and the numbering are enforced
  by `npm run check:docs`.

## ADR-0001: Static Astro brochure + manual order handling (2026-10-06, accepted, retroactive)

### Context

Family shop, no operations staff; Khanh is code-first but evaluated six
platforms (Shopify, WooCommerce, Medusa, Vendure, Snipcart, Foxy) before
choosing — the comparison lives in
[docs/research/ecommerce-platform-research.md](research/ecommerce-platform-research.md)
(promoted from untracked `out/` on 2026-10-06). Real order volume flows
through Zalo/hotline conversations today; nobody asked for a cart.

### Decision

Pure static catalog (Astro, no backend). Orders via Zalo/hotline buttons on
every page; the web form appends enquiries to a Google Sheet for humans to
work. No cart, no payments, no accounts.

### Consequences

~Zero runtime cost and no order infrastructure to run or secure; but no
cart/payments, and order handling stays manual. The catalog is
Medusa-shaped (see ADR-0004) so the exit path stays open. REVISIT TRIGGER:
manual order handling breaks, or customers demand online payment — that is
the only condition under which Medusa migration is reconsidered.

## ADR-0002: GitHub Pages project site deployed by GitHub Actions (2026-10-06, accepted, retroactive)

### Context

Free, zero-ops static hosting under the existing GitHub account
(fropppy.github.io); the repo is a project site, so the base path is
/gift-business/.

### Decision

GitHub Pages project site: `site: 'https://fropppy.github.io'`,
`base: '/gift-business'` (astro.config.mjs:14-15), `.nojekyll` in public/,
deploy.yml on push to main using SHA-pinned actions with weekly dependabot
updates; PR checks run in a separate workflow (check.yml).

### Consequences

Publishing is one merge to main. Costs: the required-check coupling (job id
`check` is main's required status context — renaming it silently breaks
protection) and the unverifiable-from-repo one-time Pages source toggle
(Settings → Pages → Source = GitHub Actions, no file trace).

## ADR-0003: Apps Script + Google Sheet as the order back office (2026-10-06, accepted, retroactive)

### Context

The family already lives in Google Sheets; no server or database was wanted,
and order status is worked by humans (Mới → Đã giao…).

### Decision

A no-auth Apps Script Web App `/exec` endpoint appending validated rows to
the "Đơn hàng" sheet, hardened in depth: honeypot, formula-injection
neutralize, per-phone rate limit before sheet access, field caps, constant
error strings, plus LockService order IDs and 5-minute dedupe
(apps-script/Code.gs; setup in apps-script/SETUP.md).

### Consequences

The Sheet doubles as the family's back office and (future) catalog CMS —
schema changes are breaking and need SETUP.md updated in the same PR. The
browser never reads responses (no-cors), so verification is a direct curl.
Security is verified by reading the code: Apps Script has no test harness
and nothing in CI covers it.

## ADR-0004: Medusa-shaped product data (2026-10-06, accepted, retroactive)

### Context

The platform research (ADR-0001) kept Medusa as the credible fallback; data
redesign is the expensive part of any later migration.

### Decision

Product JSON mirrors the Medusa product model from day one: slug→handle,
name→title, `price` as a Pricing-Module record `{amount, currency_code}`
(src/utils/catalog.ts:5-13).

### Consequences

A later Medusa import needs no data redesign; the cost is slight
indirection (a Pricing-Module-shaped price record on a static site that
never calls Medusa).

## ADR-0005: Seasonal theme system (2026-10-06, accepted, retroactive)

### Context

Tết is the shop's peak season; trung-thu (rằm tháng 8) is the second gifting
moment. Themes must switch without a rebuild and without flashing.

### Decision

Three whitelisted themes (base/tet/trung-thu) as CSS custom-property
overrides; calendar auto-selection (Nov–Feb → tet, Sep → trung-thu as a
Gregorian approximation) with a localStorage `nm:theme` manual override; the
whole engine is an `is:inline` synchronous head script
(BaseLayout.astro:66-134). Contrast per theme is gated by
scripts/check-contrast.mjs.

### Consequences

No-flash seasonal dressing with an escape hatch for calendar drift. Cost:
the inline theme script forces script-src 'unsafe-inline' in the CSP — a
documented tradeoff (see ADR-0007).

## ADR-0006: Deterministic gates as the enforcement layer (2026-10-06, accepted, retroactive)

### Context

Instruction files are context, not enforcement: an agent without boundaries
will "fix" a failing suite by deleting the test. The repo needed its rules
executable.

### Decision

Rules that matter become deterministic node gates wired into the required CI
context: check-contrast (WCAG per theme), check-output (dist/ artifact
assertions), and — added with this documentation system — check-docs (docs
index, links, instruction-file integrity). All run in check.yml's `check`
job, which main's branch protection requires.

### Consequences

Rot fails loudly: an un-indexed doc, a broken link, an oversized AGENTS.md,
or a malformed ADR blocks merge. Agent claims about dist/ or tokens must
become check assertions, not prose.

## ADR-0007: Deny-by-default CSP meta with both Apps Script connect hops (2026-10-06, accepted, retroactive)

### Context

GitHub Pages serves no response headers, so the CSP ships as a meta tag. The
Apps Script /exec URL answers fetch with a 302 to a one-time
script.googleusercontent.com URL, and CSP is enforced against every redirect
hop.

### Decision

`default-src 'none'` with a narrow allow-list (Google Fonts CSS/files, both
Apps Script origins in connect-src) as a meta tag on every page
(BaseLayout.astro:44-47, commit 8c2af58), asserted on every dist/ page by
check-output.mjs.

### Consequences

Injected payloads cannot pull remote code or exfiltrate to non-allow-listed
origins. Documented limitation: script-src carries 'unsafe-inline' (the
theme engine is inline and Astro inlines bundles — BaseLayout.astro:24-43),
so this CSP does not stop inline XSS. Omitting the
script.googleusercontent.com hop would break every order-form submit once
the webhook is live — that failure mode is why both hops are allow-listed.

## ADR-0008: Personal workflow style encoded in ZCODE.md, not user-scope memory (2026-10-06, accepted)

### Context

Agent-guidance research consistently separates personal preferences into
user-scope memory, keeping shared instruction files project-objective. The
owner (Khanh) explicitly required otherwise for this repo: ZCODE.md must
encode his communication style (caveman ultra chat) and his push policy,
because ZCODE.md is the project gateway every agent working here reads.

### Decision

Recorded deviation: personal working style for THIS project lives in
ZCODE.md (working rules 4 and 8), while the cross-tool AGENTS.md carries
only project-objective rules so GitHub-side and other-tool agents get no
personal-style noise. User-scope memory stays for corrections and
preferences that are not repo policy.

### Consequences

A future session must not "tidy" ZCODE.md to the textbook shape by deleting
rule 8 or relocating it — this ADR is the barrier. If the owner changes the
style or push policy, edit the ZCODE.md rule and supersede this ADR in the
same change. Push policy stays as rule 4 states it: never push without the
owner reviewing the results first.

## ADR-0009: Editorial re-style + zero-JS motion layer (2026-10-08, accepted)

### Context

The 2026-10-07 pass left the catalog calm but visually flat: display type
capped at 5rem, panel chrome (fills, 14/22px radius, wide soft shadows) on
every surface, and no entrance motion of any kind. The owner-approved
editorial spec asked for a quiet-luxury re-style plus a motion layer under
hard constraints: CSP stays `script-src 'self' 'unsafe-inline'` with zero
new JavaScript, reduced-motion must be honored, the four gates must not
weaken, and the check-docs CITED_FACTS pins plus the one living file:line
citation into global.css (roadmap.md:83 → `.hero-title` at global.css:608)
must survive the change.

### Decision

Ship as two disjoint, strictly ordered regions of global.css. (1) In-place
swaps inside lines 1–1502 — zero line-count change (values swapped, a few
lines also gaining packed-in declarations): display cap
6rem (floor/rate byte-identical), radius 14→10 / 22→16px, closer fainter
shadows, section rhythm clamp(3.5rem, 8vw, 7rem), panel chrome replaced by
a ruled-rail grammar (hero-main paper-on-cream, story-facts in-flow rail,
occ-chip ruled index entries, hairline filter rows), Playfair folio
numerals on the steps and contact channel index — plus the one font move:
the css2 link at BaseLayout.astro:102 swaps Playfair's static instances
for the variable axis (ital,wght@0,400..900;1,400..700). (2) An
append-only layer after global.css:1502 carries the 13-row motion
inventory and the new static selectors, under binding architecture rules:
every animation inside `(prefers-reduced-motion: no-preference)`;
scroll-driven entrances additionally inside
`@supports (animation-timeline: view())` with the `animation` shorthand
only there (no support = today's fully-visible site); animated properties
limited to transform / opacity / font-variation-settings; and a
load-bearing `(prefers-reduced-motion: reduce)` block reverting
`animation-timeline: auto !important` on everything, because the existing
duration kill cannot stop progress-based timelines.

### Consequences

No-JS and no-scroll-timeline visitors get today's fully-visible site plus
the static retune; reduced-motion users see every reveal at end state.
Zero color values moved, so the 60-pair contrast table and both seasonal
theme blocks stand untouched; `:root` stays 56 tokens. Appended rules win
cascade ties, which is what lets the layer override base rules without
editing them. Binding discipline going forward: global.css lines 1–1502
must never gain or lose a line — any pre-1503 insert is a stop-and-replan
event that must move the roadmap citation and every matching check-docs
pin in the same commit (the move-together protocol in check-docs.mjs),
never an in-flight workaround. Known inert leftover, recorded so it is not
misread as a lost hover affordance: `.site-nav a:not(.btn):hover` still
declares `border-bottom-color: transparent` (global.css:421), unrenderable
under the same rule set's `border-bottom: none` (:416) — the desktop hover
underline is the appended row-10 `::after` draw; the dead declaration stays
because deleting a pre-1503 line is itself a stop-and-replan event. The
variable-Playfair URL serves 23
@font-face blocks (35 before) but its axis floor is 400: no keyframe may
start below `wght` 400. Design record: docs/design-language.md §10.

## ADR-0010: Category landing pages at /danh-muc/ + versioned og:image (2026-10-28, accepted)

### Context

The 7 categories and 12 occasions existed only as client-side
`?category=`/`?tag=` filter views of `/products/`, so no URL
could rank for "giỏ quà Tết" / "quà khai trương" (canonicals
consolidated the variants but nothing targeted the queries); social
shares rendered with no preview image because `public/images/` held
only SVGs, which Zalo/Facebook crawlers do not render.

### Decision

Build exactly three landing pages at
`/danh-muc/<slug>/` (Tết, khai-trương–tân-gia, doanh nghiệp) from one
`getStaticPaths` over categories — not all 19 category/occasion
combinations, to avoid templated thin pages; repoint matching internal
links; ship one sitewide og:image as a **versioned** PNG
(`og-default-v1.png`, 1200×630, <1 MB — Zalo's 1.39 MB cap binds)
because Facebook and Zalo cache previews by URL: image swaps ship as
new filenames plus a re-scrape.

### Consequences

Page count 21→24; sitemap route lists
(generate-sitemap.mjs + check-output.mjs) move in lockstep by design;
a new check-output assertion pins the og tags on every page; filter
views keep the `/products/` self-canonical (no noindex); heading
skips beyond the Hero tile and real photos remain open (roadmap).

## ADR-0011: Tết theme recast — tokens plus tet-scoped dressing for Đinh Mùi 2027 (2026-11-21, accepted)

### Context

For the Tết Đinh Mùi 2027 season the tet theme stops being a
tokens-only palette register and gains tet-scoped typography and
ornament dressing. The forces at play, all fixed by the
owner-approved plan v2 of 2026-11-21: scope covers plan stage 1a plus
the stage-2 non-wine items; the dual-brand line and the photos + line
art art direction are in; red fix (b) is chosen — the season's price
and badge red moves to the deeper brick end of the red family instead
of retuning the year-round crimson; the brochure palette behind the
new values was measured, not eyeballed (median-cut quantization of
the brochure art); and the legacy placeholder SVG art keeps the old
crimson this season, so the two reds coexist by design until real
photos land. The season's first merge is live publishing: merge to
main deploys to GitHub Pages immediately, so a rollback runbook has
to exist before that merge.

### Decision

Same-line swaps inside the tet block of src/styles/global.css (root
token count stays 56, tet override count stays 12): `--bg`
#fdf3e7 → #fbeae6; `--primary` #c0272d → #961914; `--primary-deep`
#a11f26 → #7c130f; the redundant `--primary-ink` override (same white
as the root token) is replaced by a `--tet` override #b73927 — red
fix (b); `--border` #ebd9c3 → #ecd9c9; `--border-strong` #dec9ae →
#dfc7b3. The gold family is unchanged. Append-region additions,
tet-scoped and `display: none` in base and trung-thu: ALL-CAPS +
0.08em tracking on section headings at the 700px breakpoint and up
(source text stays mixed case for screen readers; line-height is
untouched because Vietnamese stacked diacritics need the vertical
room), the `.tet-divider` rule–star–rule ornament under section
titles, and the `.price-rule` price bracket. The ornaments are
inline SVG, `aria-hidden`, `focusable="false"`, colored through
`currentColor`; the star is an SVG path, never the text glyph
U+2726. Hero art ships as hero-tet-1/2/tile.svg (brochure-language
botanical line art on the new background), and the theme script's
hero probe now sets the three `--hero-*` tokens synchronously before
paint — the old onload swap flashed the base hero — keeping the
onerror guard that drops the token if a file 404s.

### Consequences

The contrast gate still audits the season's load-bearing pairs, now
on the new background, measured by the real check-contrast run
(exit 0, 60 pairs): price ink (--tet) on tet bg 4.97:1 and white
badge on --tet 5.79:1, with primary ink on bg 7.36:1, muted ink
5.24:1, gold text 5.06:1, and deep gold hover 6.21:1 around them.
Base and trung-thu render identically to before — every addition is
scoped to `[data-theme='tet']` and hidden by default. The owner
reviews the built site before merge; merge = live on GitHub Pages,
which is why docs/tet2027-rollback.md (revert sequence + post-rollback
verification + the 2027-01-20 → ~2027-02-15 fulfillment-season
freeze) ships with this decision. Design record:
docs/design-language.md §12.

## ADR-0012: Season special layer on tet — hộ-mệnh hero band + porcelain ground (2026-11-22, accepted)

### Context

The vermilion tet recast (ADR-0011) is the season's base look; plan
v1 of 2026-11-22 added a differentiated "special" riding on it for
the Đinh Mùi 2027 selling window. The forces at play, all fixed by
the owner's answered decisions D1–D4 of 2026-11-22 (plan v1 §5): the
hộ-mệnh anchor reads Đinh Mùi 2027 as nạp âm Thiên Hà Thủy — ink-navy
plus white and metallic gold, green supportive — while every competitor
capture is red+gold, so the differentiation case is market evidence,
not taste; direction A "Ink Lacquer Classic" (lacquer-navy hero +
one navy band on porcelain) plus direction B's sapphire jewel won the
design-judge ranking over B's full indigo ground and a vermilion-seal
variant whose reds are rejected outright on the navy field; the
mechanism choice was live — recast tet in place (destroys yesterday's
shipped look), a fourth `[data-theme]` (proven feasible by a probe,
but a page-wide navy token theme is mathematically forced onto a
near-black #010409 ground — the #10233f sketch ground cannot satisfy
the gate's binding pairs — and carries a razor-thin `--tet` pair as a
permanent liability, plus the ask-first fourth-theme red line), or a
tet-scoped append layer; and the design-language §4.1 one-family font
rule blocked the ceremonial year wordmark. Nothing shipped on spot
arithmetic: every palette value was validated BEFORE implementation
by dry-running the real `npm run check:contrast` in three scratch
copies — direction A, direction B, and the fourth-theme probe, exit 0
in each, the judge re-running every exit rather than inheriting the
verdict engineers' claims.

### Decision

Owner decisions D1–D4, answered 2026-11-22: (D1) direction A "Ink
Lacquer Classic" + sapphire jewel; (D2) mechanism = tet-scoped append
layer, not a fourth theme and not a recast; (D3) Fraunces as the
year-wordmark family, superseding the §4.1 one-family rule for this
layer only; (D4) emoji→SVG stage art included in S1. The landed
Stage S1 slice:

- Porcelain swap, same-line inside the tet token block
  (global.css:97-115): `--bg` #fbeae6 → #fffef1. The tet block stays
  exactly 12 overrides and `:root` stays 56 tokens; the block's ratio
  comments were recomputed on the new ground (gold text `--accent-strong`
  5.06 → 5.82:1, price ink `--tet` 4.97 → 5.71:1, deep-gold hover
  6.21 → 7.14:1, primary link 7.36 → 8.46:1) — the swap improves the
  season's worst body pair.
- The special layer as one append block (global.css:2540-2746), every
  rule `[data-theme='tet']`-scoped or default-hidden: navy #10233f
  hero band and one navy collection band; white ink #fffdf5 (15.46:1
  on navy); light muted #b3ad9f (7.04:1 — the inherited `--muted`
  #6c6053 fails on navy at 2.58:1 and is re-pointed); matte gold
  #c89b3c at 6.15:1 as TEXT on navy — gold's role inverts, it stays
  decorative-only on the porcelain body; cocoa ink on gold fills
  6.16:1 with hover going LIGHTER on the dark field (#d6b569, cocoa
  8.00:1); sapphire #1b3f8d strictly decor-only — the .tet-band
  radial glow inside a gold hairline ring, 1.61:1 on the field, below
  every threshold on purpose. The sapphire hex is APPROXIMATE: no
  official sRGB value is published for Coloro 125-28-38 (WGSN×Coloro
  COTY 2027), so the physical swatch is authoritative and any later
  correction touches only art/glow literals, never a text pair.
- Fraunces joined to the single css2 request (BaseLayout.astro:102;
  Vietnamese subset verified roman + italic, variable
  ital,opsz,wght@0,9..144,100..900;1,9..144,100..900, via the css2
  API with a full Chrome UA — the repo's documented verification
  method). The CSP already allow-lists both font origins, so no
  security-meta change. The `.tet-year-wordmark` "Đinh Mùi 2027"
  (Hero.astro:16) is default-hidden and gold on the navy hero field
  only — the same gold fails as text on the porcelain body.
- hero-tet-1/2/tile.svg replaced in place — same filenames, same
  viewBox/aspect — recomposed as navy + gold art with the sapphire
  jewel core; and the collection band's eyebrow + lead retell the
  hộ-mệnh story (Thiên Hà Thủy, lapis with gold, the chàm-dyeing and
  gold-embossing craft), retiring the old "huy hiệu" wording in favor
  of "thiệp" (index.astro:52-53).

### Consequences

Provenance: every value above is a real-gate dry-run value —
`npm run check:contrast` exit 0 in the direction-A copy (60 pairs),
the direction-B copy (60), and the fourth-theme probe (80 pairs
across 4 themes), re-run by the judge; the landed tree then gated as
a whole (recorded in this date's improvement-log entry). The append
block is invisible to the gate's theme parser — scoped selectors
never form a bare `[data-theme]` block — so the audited table stays
60 pairs and base and trung-thu render pixel-identical; the
fourth-theme route stays in reserve with its near-black ground,
razor-thin `--tet` pair, and ask-first red line recorded. Governance:
§4.1's "no additional families" is superseded for the special layer
(the dated record lives in docs/design-language.md §13); D4's
emoji→SVG stage art is decided but NOT part of the landed slice — the
emoji icons still stand in the data files and that work stays open.
Rollback: revert the Stage S1 commit (before push, on develop; after
merge, via the existing revert-PR sequence in docs/tet2027-rollback.md)
— the porcelain swap rides the same revert; the append block can also
be deleted as one unit with its markup. The 2027-01-20 → ~2027-02-15
fulfillment-season freeze is unchanged. Design record:
docs/design-language.md §13.

