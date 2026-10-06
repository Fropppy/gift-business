# Memory system

Three layers and one conflict rule: when layers disagree, the repo layer
wins — fix the losing layer in the same session that discovers the
conflict. One source of truth per rule; nothing lives in two layers at
different truths.

## Layer 1

Repo docs — canonical, shared. Everything under docs/ plus ZCODE.md,
AGENTS.md, README.md: git-versioned, so anyone (any tool, any machine) gets
the same answer, and git is the source of truth.

Rituals:

- **Same-PR rule:** a change and the doc update for it land in one PR;
  enforced where the docs gate can see it (`npm run check:docs` fails an
  un-indexed doc, a broken link, a malformed ADR).
- **Decisions are append-only:** a changed decision gets a new superseding
  ADR, never an in-place edit (decisions.md).
- **Index-as-contract:** a doc not linked from docs/README.md fails CI, so
  un-indexed docs cannot merge.

## Layer 2

Personal agent memory — outside the repo, machine-local. ZCode auto-memory
at `~/.zcode/cli/memories/projects/gift-business-db800b42ceb8f0d7/memory/`
(verified present: a MEMORY.md index auto-loaded every session plus
one-fact-per-file notes such as user-workflow-preferences.md). Never
committed, never shareable via git.

What belongs: Khanh's corrections and preferences; session task-state;
scratch/write-ahead notes during long /workflow runs — compaction does not
reliably carry instructions to the next context, so write state down before
risky steps.

What never belongs: secrets or live endpoints; anything derivable from the
repo; anything Layer 1 should own.

Rituals: one fact per entry; write at session end when a correction
happened; PRUNE any note whose canonical answer now exists in repo docs
(repo wins).

## Layer 3

Improvement log — append-only and shared:
[improvement-log.md](improvement-log.md). Dated entries, never rewritten.
The promotion ritual is the engine: an observation that recurs (or a
mistake an agent repeats) gets promoted into the durable layer that fits —
a ZCODE.md working rule, a new check assertion in a scripts/check-*.mjs, or
a docs/ section — and the entry is marked "promoted →" where it landed.

Rituals: append after a meaningful run or a monthly retro at most;
promotion is the only path from the log into ZCODE.md or docs/; the gate
enforces the dated-entry format and chronological order.

## Session rituals

- **START:** AGENTS.md loads automatically → read ZCODE.md → open the
  orientation-map doc that matches the task.
- **DURING:** run the gates after each meaningful change; on long /workflow
  runs, write a state note to Layer 2 before risky steps.
- **END:** run all four gates; append a Layer 3 entry if a lesson or
  correction occurred; prune Layer 2; report results with file:line
  citations and name anything not run as not run.

## What never goes in memory

- Secrets or live endpoints in ANY instruction file — AGENTS.md is a
  prompt-injection surface (GitHub-side agents read it from PR head
  branches).
- Derivable facts: product lists, token counts, gate commands — CI and
  src/ already encode them.
- Trivia that fails the removal test: "would removing this cause a
  mistake?" If not, it does not belong.

## ZCODE platform facts

- Loading order: user `~/.zcode/AGENTS.md` first (does not exist on this
  machine — verified), then the workspace AGENTS.md, which overrides and
  narrows it.
- ZCODE.md is NOT auto-loaded — it is reached only via the AGENTS.md
  pointer.
- `.zcode/` is gitignored: session-local skills/commands live there and are
  not shared.
- The Layer 2 memory dir above is machine-local; in tracked files always
  write it with `~/`, never as an absolute home-directory path (the docs
  gate rejects those literals for portability).
