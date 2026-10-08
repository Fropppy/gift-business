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

