# Docs index

One curated index for every document in the repo. Each doc lives at a stable
path, covers one topic, and links to its siblings instead of copying them —
follow the link that matches your task, read nothing else up front. This
index is machine-enforced: every markdown file under docs/ must be linked
from here or `npm run check:docs` fails, so un-indexed docs cannot merge.

## What's here

| Doc | Covers | Read when |
| --- | --- | --- |
| [docs/README.md](README.md) | This index. | You are lost. |
| [docs/architecture.md](architecture.md) | Site, theme engine, order pipeline, build/CI, security posture, known limitations. | You need to know how the system IS. |
| [docs/decisions.md](decisions.md) | Append-only ADR log (ADR-0001…) with rationale. | You need to know WHY something was chosen, or want to change it. |
| [docs/operations.md](operations.md) | Runbook: go-live checklist, placeholder replacement, order triage, Apps Script redeploy, release flow. | You are doing something repeated, not reading. |
| [docs/roadmap.md](roadmap.md) | Now / Next / Later / Done — pending owner actions and conditional work. | You are picking work or checking status. |
| [docs/design-language.md](design-language.md) | The design-language proposal the current UI implements (tokens, themes, WCAG). | You touch themes or design tokens. Historical record. |
| [docs/ai/memory-system.md](ai/memory-system.md) | The 3-layer memory model and its update rituals. | You are an agent deciding where a fact belongs. |
| [docs/ai/improvement-log.md](ai/improvement-log.md) | Append-only dated log of observations and promotions. | You want the incremental history of lessons. |
| [docs/research/ecommerce-platform-research.md](research/ecommerce-platform-research.md) | Verbatim 2026-10-06 six-platform comparison (Shopify/WooCommerce/Medusa/Vendure/Snipcart/Foxy) — the evidence behind ADR-0001. Historical record, quotes third-party commands. | You are re-evaluating the platform decision. |
| [apps-script/SETUP.md](../apps-script/SETUP.md) | Vietnamese, family-facing: Google Sheet + Apps Script webhook setup. | You touch apps-script/ or the order pipeline. |
| [README.md](../README.md) | Vietnamese project intro, local run, deploy steps, placeholder table. | A human asks what this repo is. |
| [AGENTS.md](../AGENTS.md) | Auto-loaded agent instructions: gates, git policy, red lines. | You are an agent (it loads anyway). |
| [ZCODE.md](../ZCODE.md) | Memory gateway: orientation map, working rules, project facts. | You are an AI starting a session here. |

## Reading order

Short task paths; follow only the one that matches your task.

- **Content edit** → [architecture.md](architecture.md#site) (what the data
  layer is) + [operations.md](operations.md#replacing-placeholder-content)
  (what is still placeholder).
- **Theming** → [design-language.md](design-language.md) (rationale) +
  [architecture.md](architecture.md#theme-engine) (how the engine works).
- **Order pipeline** → [architecture.md](architecture.md#order-pipeline) +
  [SETUP.md](../apps-script/SETUP.md) (deploy the webhook) +
  [operations.md](operations.md#orders) (triage when orders stop arriving).
- **CI / release** → [architecture.md](architecture.md#build-cicd) +
  [operations.md](operations.md#release-flow).

## Conventions

- docs/ is written in English (audience: Khanh + agents), matching
  design-language.md; apps-script/SETUP.md stays Vietnamese as the
  family-facing exception.
- One topic per file, at a stable path. Cross-link, never copy.
- Decisions are append-only in decisions.md — supersede, never edit.
- Every new doc must be added to this index in the same change;
  `npm run check:docs` fails otherwise (that is the anti-rot rule).
