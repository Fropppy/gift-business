# ZCODE.md — memory gateway

First read for any AI working in this repo. It is NOT auto-loaded — AGENTS.md
points here. It routes you to the right doc, carries the working rules, the
non-derivable project facts, and the session rituals.

## Orientation map

One question → one file. Links, never summaries.

| Your question | Go to |
| --- | --- |
| How do the site and the order pipeline fit together? | [docs/architecture.md](docs/architecture.md) |
| Why was X chosen? | [docs/decisions.md](docs/decisions.md) |
| How to deploy, operate, replace placeholders, triage orders? | [docs/operations.md](docs/operations.md) |
| How does the owner update products / contact data himself? | [docs/owner-updates.md](docs/owner-updates.md) |
| What is pending / blocked / conditional? | [docs/roadmap.md](docs/roadmap.md) |
| How does the memory system work? | [docs/ai/memory-system.md](docs/ai/memory-system.md) |
| Design-system rationale (tokens, themes, WCAG)? | [docs/design-language.md](docs/design-language.md) |
| Full platform-comparison evidence behind ADR-0001? | [docs/research/ecommerce-platform-research.md](docs/research/ecommerce-platform-research.md) |
| How to set up the Apps Script webhook? | [apps-script/SETUP.md](apps-script/SETUP.md) |
| What has been learned, incrementally? | [docs/ai/improvement-log.md](docs/ai/improvement-log.md) |
| Full doc index | [docs/README.md](docs/README.md) |

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local dev server (http://localhost:4321/gift-business/). |
| `npm run build` | Build the static site (21 pages) into dist/. |
| `npm run check:contrast` | WCAG gate: token pairs per theme, rest + hover + focus ring. |
| `npm run check:output` | dist/ artifact assertions — run AFTER `npm run build`. |
| `npm run check:docs` | Docs gate: index completeness, links, sections, budgets, ADR/log format. |
| `npm run generate:placeholders` | Regenerate the placeholder SVG art. |

Ad-hoc secret scan (no dedicated scanner is installed; pattern grep over every
blob in history — zero hits when last run, 2026-10-06). Two details that
matter: the `--` must come AFTER the rev list — placed before it, git parses
the SHAs as pathspecs and the scan silently searches nothing (proven in a
sandbox repo); and the pathspec excludes skip the three files that quote
this very pattern, so the scanner never reports its own documentation:

```bash
git grep -I -E 'ghp_|gho_|ghs_|github_pat_|AKIA|ASIA|AIza|xox[baprs]-|sk_live_|sk_test_|npm_[A-Za-z0-9]|PRIVATE KEY' $(git rev-list --all) -- ':(exclude)ZCODE.md' ':(exclude)docs/architecture.md' ':(exclude)docs/ai/improvement-log.md'
```

Branch-protection inspection:

```bash
gh api repos/Fropppy/gift-business/branches/main/protection
```

## Working rules

These are the canonical rules; AGENTS.md carries compressed copies of the
gate/git/red-line ones — update both files in the same commit.

1. Run every gate before declaring anything done: `npm run build`,
   `npm run check:contrast`, `npm run check:output` (AFTER build),
   `npm run check:docs`. There is no unit-test suite — these four plus CI
   job "check" are the entire verification story. A gate that wasn't run this
   session is reported as not run, never as passed.
2. Never weaken a gate to make it pass. If a check fails, fix the code or the
   doc. Editing scripts/check-*.mjs to lower the bar, or renaming check.yml's
   job id `check` (branch protection requires that exact status context), is
   forbidden.
3. Commits land on develop only. main is protected (PR + required `check`
   context) — never push to main, never force-push, never delete branches.
4. Never push anywhere without the owner (Khanh) reviewing the results first.
   Commit locally on develop, report what changed with citations, and wait.
5. Commit style is Conventional Commits matching git log (`fix(frontend):`,
   `fix(apps-script):`, `docs:`, `chore(ci):` …) — subject ≤50 chars, body
   only when the why isn't obvious.
6. Multi-step work goes through /workflow (the owner's pattern for big
   tasks): decompose, run subagents, validate in layers — deterministic gates
   are layer 1, a fresh-context correctness review of the diff is layer 2.
7. Subagents cannot call MCP tools. When a subagent task depends on library
   or platform knowledge, embed the relevant documentation into the ask
   itself — do not tell the subagent to "look it up".
8. Chat replies use caveman ultra mode (terse); code, docs, and commit
   messages are written normally. (Deliberate deviation from the
   personal-style-out-of-shared-files convention — rationale and owner
   requirement recorded in ADR-0008, docs/decisions.md.)
9. Verify claims before reporting them: cite file:line for code facts, or the
   exact command and its output for checks. If something couldn't be
   verified, say so plainly — no plausible guesses dressed as findings.
10. Never set `src/data/site.json` `orderEndpoint` — the owner deploys the
    Apps Script and pastes the /exec URL himself. While it is `""` the
    contact form correctly runs its honesty-gate branch; that is intended
    behavior, not a bug.
11. Never touch: dist/ (build output), gift-business-site.zip (unknown
    provenance), the CSP meta in BaseLayout.astro, or the Apps Script
    defenses in Code.gs (formula-injection neutralize, per-phone rate limit,
    field caps, honeypot). Ask first before adding themes beyond
    base/tet/trung-thu, changing the Google Sheet schema — the Sheet is
    the family's back office — or making any new dependency or CI change.
12. Read this file before working here (via the AGENTS.md pointer), and after
    any meaningful session append what was learned: recurring lessons get
    promoted into rules here or into gate assertions via
    docs/ai/improvement-log.md — never leave a correction only in chat.

## Memory model

Three layers; the full spec is [docs/ai/memory-system.md](docs/ai/memory-system.md).

- Layer 1 — repo docs (canonical, shared): docs/ + ZCODE.md + AGENTS.md +
  README.md, git-versioned. Git is the source of truth.
- Layer 2 — personal agent memory (outside the repo, machine-local):
  `~/.zcode/cli/memories/projects/gift-business-db800b42ceb8f0d7/memory/`
  (MEMORY.md index + one-fact-per-file notes). Never committed.
- Layer 3 — append-only improvement log:
  [docs/ai/improvement-log.md](docs/ai/improvement-log.md). Dated entries;
  recurring lessons get promoted into a durable layer and marked.

Conflict rule: when layers disagree, the repo layer (1) wins; fix the losing
layer in the same session that discovers the conflict.

## Project facts

Non-derivable facts — things an agent cannot safely infer from a quick read.

- **Honesty gate.** While `src/data/site.json` `orderEndpoint` (line 16) is
  `""`, ContactForm refuses to promise delivery and shows the Zalo/hotline
  fallback (`src/components/ContactForm.astro:138-143`). Intended, not a bug.
- **FOUC constraint.** The theme engine is a synchronous `is:inline` script
  in `<head>` (`src/layouts/BaseLayout.astro:105-173`). It must stay inline:
  bundled/module scripts run after first paint and would flash the wrong
  palette. dist/ behavior is asserted by scripts/check-output.mjs.
- **CSP both hops.** `connect-src` allow-lists BOTH script.google.com and
  script.googleusercontent.com (`src/layouts/BaseLayout.astro:72-75`,
  commit 8c2af58): the /exec URL 302-redirects to a
  script.googleusercontent.com URL and CSP is enforced on every hop —
  omitting it breaks every submit once the webhook is live. Known,
  in-source-documented limitation: script-src carries 'unsafe-inline'
  (BaseLayout.astro:52-71) because the theme engine is inline and Astro
  inlines bundles — this CSP blocks remote code/exfil, not inline XSS.
- **Job-id coupling.** check.yml's job id is `check`
  (.github/workflows/check.yml:15); main's branch protection requires that
  exact status context. Renaming the job silently breaks the required check
  on main.
- **PR-only checks.** check.yml triggers on `pull_request` only
  (.github/workflows/check.yml:7-8) — pushing to develop produces no CI
  run. Match a run's headSha (`gh run list --json headSha`) to the commit
  before citing it as that commit's verification.
- **Node version.** >= 22.12, never 23 (Astro 7; pinned in deploy.yml and
  check.yml).
- **Theme calendar.** Nov–Feb → tet; Sep → trung-thu — a Gregorian
  approximation of rằm tháng 8 âm lịch that occasionally misses; the manual
  switcher is the escape hatch (BaseLayout.astro:125-135).
- **Token truth.** `:root` in src/styles/global.css declares 56 custom
  properties; tet and trung-thu each override 12. Older prose said 53, then
  55 — count with the gate's parser (node over the css text), never trust
  older docs.
- **Webfonts predate everything.** The Google Fonts `<link>` in
  BaseLayout.astro has loaded Be Vietnam Pro + Playfair Display since the
  initial commit (b1a1278); CSP style-src/font-src allow exactly those two
  origins. "Adding a font family" means editing that one link — a new origin
  needs a CSP change, which is an ask-first/never-touch zone.
- **The Sheet is the back office.** The family edits content/order status in
  Google Sheets; Apps Script behavior is verifiable by reading Code.gs only
  (it runs in Google's runtime — no test harness, nothing in CI covers it).
  Schema changes are breaking for their workflow.

## Session checklist

- **Start:** AGENTS.md loads automatically → read this file → open the
  orientation-map doc that matches the task.
- **During:** run the gates after each meaningful change; on long /workflow
  runs, write a state note to Layer 2 (personal memory) before risky steps —
  compaction does not reliably carry instructions to the next context.
- **End:** run all four gates; append a Layer 3 entry if a correction or
  lesson occurred; prune personal memory of anything the repo now answers;
  report results with file:line citations and name anything not run as not
  run.

## Updating this file

- Add a line only when an agent repeats a mistake or a non-derivable fact
  appears; keep ≤400 lines (gated by check:docs).
- When a fact becomes derivable from code or canonical in docs/, replace it
  with a link.
- AGENTS.md carries compressed copies of Gates / Git / Never touch — update
  both files in the same commit. check:docs asserts canary phrases from
  every duplicated block appear in BOTH files — a sample that catches
  missing red lines, not a substitute for the same-commit rule.
