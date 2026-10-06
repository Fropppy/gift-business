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
- Flip docs/design-language.md:3 `Status: proposed` → implemented (all 10
  plan steps shipped; contrast/output gates green).
- Decide the fate of gift-business-site.zip (unknown provenance,
  gitignored) — delete or archive outside the repo.

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

- 2026-10-06: documentation + memory system built (AGENTS.md, ZCODE.md,
  docs tree, ADR-0001..0007 backfilled); `npm run check:docs` gate added to
  the required CI context.
- 2026-10-06: platform research promoted verbatim from untracked out/ to
  docs/research/ecommerce-platform-research.md — ADR-0001's evidence is
  now tracked in git, no longer machine-local.
- 2026-10-06: dependabot PR #1 resolved — setup-node pin bumped to the
  v7.0.0 SHA (820762786026740c76f36085b0efc47a31fe5020) in check.yml;
  dependabot PR closed in favor of the manual pin.
