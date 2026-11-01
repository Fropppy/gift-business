# Security baseline

The repo's security posture at a point in time, and the procedure that
re-establishes it. This is the record an owner or auditor reads to answer
"how do we know the site is clean as of when?" — the live checks live
elsewhere (links below), this file pins their results and how to refresh
them.

Claims discipline: a zero-finding scan is a snapshot, never a verdict that
the project is "fully secure". Mimosa's advisory feed and GitHub's
Dependabot feed are different sources; neither supersedes the other, and
both are recorded below.

## Baseline snapshot (2026-11-01, main f68779a)

| Check | Result |
| --- | --- |
| Dependabot alerts (GitHub API, state=open) | **0** — history below |
| `npm audit` | exit 0, no advisories |
| Direct dependencies | 1: `astro` ^7.3.5 (devDependencies empty) |
| Transitive packages in lockfile | 281, incl. undici 8.12.3 and zod 4.6.7 |
| undici / zod shipped to the live site | 0 references each in dist/ — both are build-time only (undici sits under astro→unifont and only loads behind proxy env vars; zod validates build-time config/content) |
| Mimosa deep scan | **0 findings**, 281 packages / 0 advisories · scanId `scan-2026-11-01T16-11-54.097Z-094a1b0e4c08` · seal `sha256:7a8f79a931f5cd496ae01891194c18f3e69b70de76f94b8fa763e443b97f6de0` · evidence boundary: static analysis only, no runtime execution |
| CI on the scanned commit | check + deploy + smoke all green (Pages deploy run 41324630257) |

Mimosa scan artifacts (sealed report) live outside the repo under
`~/.mimosa/security-scans/` — the seal string above is the portable proof
that ties this table to those artifacts; the working papers for the 9-alert
remediation (spec + verification record) lived under `out/` and are
regenerable from the seal and git history.

## Defense layers

Each layer is documented where it lives; this file only indexes them:

- **CSP** on every page, asserted on all dist/ pages by the output gate —
  scope and the documented `unsafe-inline` limitation:
  [architecture.md](architecture.md#security-posture).
- **Apps Script webhook defenses** (formula-injection neutralize(),
  per-phone rate limit, daily cap, field caps, honeypot) —
  [SETUP.md](../apps-script/SETUP.md); the never-touch list in
  [AGENTS.md](../AGENTS.md) pins them.
- **orderEndpoint honesty gate**: while `orderEndpoint` in site.json is `""`
  the contact form runs its honesty branch on purpose —
  [operations.md](operations.md#replacing-placeholder-content).
- **Protected main**: PR + required `check` status context, strict
  up-to-date head, admins included — [architecture.md](architecture.md#build-cicd).
- **Secret scan**: ad-hoc pattern grep over all history blobs, documented
  in ZCODE.md (Commands); a dedicated scanner is still a roadmap Later item.
- **Gates**: the four check scripts (build, contrast, output, docs) are the
  regression net under all of the above — [AGENTS.md](../AGENTS.md).

## Re-baselining procedure

Run after any dependency change, any security-relevant PR, or on owner
request (otherwise no fixed cadence). Record the new row in the history
table below and refresh the snapshot table — the snapshot is the baseline;
history without a current snapshot is not one.

1. `gh api '/repos/Fropppy/gift-business/dependabot/alerts?state=open' --jq length`
   — expect a number you can explain; 0 is the goal.
2. `npm ci && npm audit` — exit 0 expected.
3. Mimosa deep scan (MCP tool, depth deep, focusFiles = the changed files)
   — record scanId + seal; never auto-fix code during a scan, and never
   word a result as "fully secure".
4. Update the snapshot table with date + main SHA. If alerts were fixed,
   append the history row.

## Alert history

| Date | Alerts | Action | Result |
| --- | --- | --- | --- |
| 2026-10-17 | PR #8 (setup-node 7.0.0→7.1.0) | merge, first execution of the manual dependabot flow | merged 564ec03 |
| 2026-10-28 | PR #13 (vite 8.3.2→8.3.5) + PR #14 (withastro/action 6.1.3→6.1.4) | merge | merged 4889a22; vite alerts #1–6 → fixed |
| 2026-11-01 | 9 open on main (5 high, 4 moderate): 8× undici GHSA + 1× zod GHSA-mrhx-c7xc-m3w5 | PR #15 (npm_and_yarn group: undici 8.11.2→8.12.3, zod 4.6.5→4.6.7) audited via workflow, branch updated via update-branch API (the `@dependabot rebase` comment had landed on a stale base), merged f68779a | 9/9 alerts → fixed, 0 open; snapshot table above is the post-fix baseline |

Merging dependabot PRs here is manual (auto-merge off, strict head
protection): verify the PR head is not behind main, let `check` run on the
updated head, merge with a merge commit, then fast-forward develop onto
main — leaving develop behind silently reverts the bump in the next
develop→main PR.
