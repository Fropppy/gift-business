# Improvement log

Dated, one lesson per entry. Append-only: never edit or delete past entries.
Mark promoted entries with → where they landed.

## Entry format

```text
  ## YYYY-MM-DD — short title
  - Observation: what happened, with citations.
  - Change: what was changed (or "none").
  - Promoted to → the durable layer that now owns it (file or gate assertion).
```

## 2026-10-06 — Docs + memory system backfilled

- Observation: the docs index (README.md) linked none of the sibling docs;
  the platform-decision rationale existed only in the untracked out/
  directory and in personal agent memory; nothing checked instruction-file
  integrity, so docs could rot silently.
- Change: this system built — AGENTS.md, ZCODE.md, docs/ tree
  (architecture, decisions, operations, roadmap, ai/memory-system, this
  log), ADR-0001..0007 recorded, `npm run check:docs` added to the required
  CI context.
- Promoted to → the whole tree; the enforcement lives in
  scripts/check-docs.mjs.

## 2026-10-06 — Review-issue lists can lag the last fix round

- Observation: the docs-system workflow's final report carried 4 "open"
  review issues; re-verification against the tree showed all 4 already
  fixed by the last builder round (secret-scan excludes proven by a
  post-commit zero-hit run; citation coverage = check-docs assertion 18,
  27 pinned ranges). Cause: the fix round landed after the final review
  snapshot, and the loop never re-checked.
- Change: none to gates — the corollary is procedural: treat a workflow's
  reported issue list as a snapshot of its last review, not of the tree;
  verify against the tree before re-fixing or reporting.
- Promoted to → covered by ZCODE.md working rule 9 (verify claims before
  reporting); logged so future workflow scripts order the final review
  AFTER the last fix round.


## 2026-10-06 — Token count drifts across docs

- Observation: the `:root` token count was cited as 53, then 55 in older
  prose, while `:root` actually declares 56 custom properties
  (--focus-ring-color was added at src/styles/global.css:41 in commit
  5aa5768); each newer doc inherited the stale number.
- Change: none to old docs — docs/design-language.md is a historical
  record.
- Promoted to → the rule "count tokens with the gate's parser, never trust
  older prose" (ZCODE.md, Project facts); docs/architecture.md states 56.

## 2026-10-06 — Stale README row survived two content passes

- Observation: README.md:29 still tells the reader to replace a site URL
  that astro.config.mjs:14 already sets correctly — nobody caught it because
  nothing checked the docs.
- Change: recorded as a roadmap.md Next item (this build's constraint allows
  README.md only one new pointer section).
- Promoted to → check:docs link/existence/index assertions, so index rot
  now fails CI.

## 2026-10-06 — Review round 1: four gate blind spots

- Observation: renaming a heading broke a deep link while check:docs stayed
  green (anchors were stripped, never verified); deleting a row from
  ZCODE.md's orientation map stayed green (only the docs/README.md index was
  gated); AGENTS.md carried an ask-first red line ZCODE.md lacked, with no
  assertion comparing the two files; the token count 56 was stated in two
  docs but nothing tied it to src/styles/global.css.
- Change: four assertion groups added to scripts/check-docs.mjs —
  anchor→heading-slug resolution, orientation-map completeness, shared
  red-line phrase sync between AGENTS.md and ZCODE.md, and token-count
  integrity (css count vs the documented number) — plus citation-anchor
  checks for site.json:16 and check.yml:15.
- Promoted to → scripts/check-docs.mjs (the enforcement layer, per ADR-0006).

## 2026-10-06 — Layer conflict on push policy, day one

- Observation: personal agent memory (Layer 2) recorded a pre-authorization
  to auto commit→push→deploy when validation passes, while the repo (Layer 1,
  AGENTS.md/ZCODE.md rule 4) says never push without the owner reviewing
  results first — the two layers contradicted each other at delivery.
- Change: Layer 2 note aligned to the repo rule (repo wins; the losing layer
  is fixed in the session that discovers the conflict).
- Promoted to → the conflict rule already in ai/memory-system.md; this entry
  records its first application.

## 2026-10-06 — Scan prose overstated actual coverage

- Observation: docs/architecture.md described the ad-hoc secret scan as
  covering PEM blocks and Stripe keys, but the canonical command in ZCODE.md
  had no PEM pattern and matched `sk-live` (hyphen), not the real
  `sk_live_`/`sk_test_` underscore prefixes — a reader would believe private
  keys were being caught when they were not.
- Change: the ZCODE.md command now includes `sk_live_|sk_test_` and
  `PRIVATE KEY`; architecture.md describes exactly the pattern list; the
  updated scan was re-run over all blobs — zero hits.
- Promoted to → rule of thumb: docs describing a check must restate the
  command's actual pattern, not the intention.

## 2026-10-06 — Scan command searched nothing

- Observation: the documented scan put `--` BEFORE the rev list, so git
  parsed the SHAs as pathspecs and quietly searched the worktree for files
  named like SHAs — every "zero hits" reported to date was vacuous (proven
  in a sandbox repo: a committed secret goes unfound with that form). And
  once the docs quoting the pattern are committed, the pattern would
  self-match those docs on every future run.
- Change: command corrected (no `--` before the revs) with pathspec
  excludes for the three files that quote the pattern; re-run over real
  history with the working form — zero hits, now a true result.
- Promoted to → ZCODE.md Commands (corrected command + both pitfalls) and
  docs/architecture.md Security posture.

## 2026-10-06 — Visual flags need geometric confirmation

- Observation: a vision pass over the mobile preview flagged a "possibly
  clipped" filter chip on /products/; rect math showed the price-chip row
  simply sits inset (scrollLeft 22.5 of a 22px overflow) — nothing clipped.
  Mid-pass both vision MCP servers hit quota caps, leaving 2 of 5 pages
  unvisioned; bounding-box checks (tap targets vs 24/44px, bottom-bar
  height vs body padding-bottom) closed those pages deterministically.
- Change: visual results reported per page as vision-verified vs
  geometry-verified; the false chip flag dropped; the same audit found a
  real pre-existing gap (card CTA 123×22 < 24px, ProductCard.astro:41) →
  roadmap Next.
- Promoted to → nothing yet (first occurrence).

## 2026-10-06 — Cite CI runs by head SHA, not recency

- Observation: PR #3's body credited run 37488956279 to f2b34d9, but its
  headSha was d04c810 — check.yml fires on pull_request only
  (check.yml:7-8), so the push of f2b34d9 created no run at all; gh run
  list right after the push showed the previous PR's checks, and the
  misattribution read like verification.
- Change: PR #4's flow matched runs by --json headSha before citing them;
  trigger nuance recorded in ZCODE.md Project facts.
- Promoted to → ZCODE.md Project facts (PR-only checks).

## 2026-10-07 — world.run opts must be an object or omitted

- Observation: a workflow's gate helper passed
  `world.run("npm", argv, cond ? {timeoutMs} : undefined)` and the whole run
  errored at the first non-build gate: the undefined crosses the call
  boundary as null and the runtime rejects "arg 3 (opts) must be an options
  object or omitted, got null". The build call (which had a real object)
  succeeded first, so the failure looked gate-specific, not arg-marshalling.
- Change: branch into two calls — one with the options object, one with no
  third argument at all — and resubmitted via AmendWorkflow, which imported
  the finished scout/plan/builder work from cache at zero tokens.
- Promoted to → personal memory (zcode-workflow-gotchas) so every future
  workflow in this repo starts with the rule.

## 2026-10-07 — Vision "clipped" flags on scroll-snap rows, twice now

- Observation: a vision pass called a scroll-snap carousel's edge card
  "clipped" — the same false positive the mobile-pass audit made on the
  price-chip row (2026-10-06). A snap carousel shows the next card partially
  ON PURPOSE (peek affordance); a screenshot cannot distinguish peek from
  clip. The workflow's reviewer fan-out also confirmed real clipping
  elsewhere (subtitle rendered twice), so the lesson is not "ignore vision"
  — it is "never settle a clipping claim without rect math".
- Change: verified with getBoundingClientRect + scrollWidth/clientWidth
  (1512 > 375, overflow-x auto, scroll-snap-type x) before accepting or
  rejecting the flag.
- Promoted to → rule of thumb: geometric claims get geometric proof;
  screenshots propose, rect math disposes.
