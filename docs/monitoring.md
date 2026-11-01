# Monitoring runbook — two lanes, three failure domains

Adopted 2026-10-17 from a four-angle research pass. The full artifact —
option table, sources, unverified register — is `out/monitoring-proposal.md`
(machine-local, gitignored); this doc is the durable repo-owned distillation.
Design: a **slow lane** (daily 07:00 ZCode digest — judgment + repo context)
plus a **fast lane** (StatusCake free uptime monitor — dumb always-on
pinging), across three failure domains: GitHub Pages (site) / ZCode host
(reviewer) / StatusCake (alerter). No single outage blinds all three, and no
repo, CI, or dependency change is involved — the AGENTS.md ask-first zone is
untouched.

Status: slow lane **dry-run passed, automation pending creation** — the
2026-10-17 dry run was all-green (`out/daily/2026-10-17.md`), but the host
allows a session to create only one scheduled task, and this repo's session
of record already owns the Friday weekly automation. Creating the digest is
a one-line ask in a fresh ZCode chat — "create the daily 7am digest
automation per docs/monitoring.md; the prompt is the fenced block" — any
fresh session can read this page and create it verbatim. Fast lane **pending
owner signup** (below). Not an ADR yet — append one to decisions.md when the
owner completes fast-lane adoption.

## The daily digest (slow lane)

Host-side ZCode automation, cron `0 7 * * *` (+07) — the entry to create in
a fresh chat is exactly the fenced block below, pinned 1:1 (keep the two
copies in sync when the checklist evolves).

**Heartbeat:** the digest notifies on EVERY run, all-clear included. No
notification by ~07:30 means the automation itself died — check the app's
automation list that morning. First scheduled fire: the first 07:00 after
creation; read the first week of digests cautiously (scheduled-context
behavior — `gh` auth, notification delivery — is proven only by real
fires). Related watch: the Friday 17:00 weekly automation's first observable
fire is 2026-10-23.

Outputs land only under `out/daily/` (gitignored): `<date>.md` ≤ 15 lines
plus the sitemap-diff baseline, pruned to the newest 30 files. The Friday
edition (`out/weekly`) is trend research and absorbs the weekly full-sitemap
sweep — fetch `/sitemap.xml`, probe every `<loc>` (currently 23 = 16
products + 7 static, incl. the three `/danh-muc/` landing pages); sweep
everything, do not sample. The write-restriction
is instruction-level, not a permission boundary: the scheduled session runs
with the workspace user's privileges; the prompt is the guard.

```text
Daily 07:00 — Nhà Mai digest. Repo root = the session workspace cwd.
0) Verify tools: curl, git, gh each respond (gh run list --limit 1). If any
   fails, still write out/daily/<date>.md naming the failure — never skip
   legs silently.
1) Read S = STATIC_ROUTES.length from scripts/generate-sitemap.mjs (line ~46)
   and N from src/data/products.json = length of its top-level "products"
   array (the JSON is an object; a literal .length returns undefined). Never
   hardcode S or N.
2) curl /, /products/, /sitemap.xml → expect 200 + body contains "Nhà Mai";
   sitemap <loc> count == N + S; every <loc> base-prefixed with /gift-business/.
   /products/ card count == N. Spot-check one product page contains its own
   product name from products.json. One known-bad path (e.g. /nonexistent-page-xyz/)
   must 404. CSP meta on /: default-src 'none'; connect-src lists BOTH
   script.google.com and script.googleusercontent.com.
3) Diff sitemap vs the previous out/daily copy; flag lost/added URLs. No
   baseline yet → save one, report "baseline established". Baseline >1 day
   old → diff anyway and state the span.
4) git fetch --quiet; commits on develop/main since the previous digest file.
   gh run list + gh pr list since that same date: flag non-success runs and
   new open PRs. Known workflows: "PR checks", "Deploy to GitHub Pages",
   "Dependabot Updates" (path dynamic/dependabot/…). Anything else
   unrecognized → report with first-seen date, keep re-reporting one line
   until identified.
5) Newest deploy.yml run head_sha == origin/main HEAD (never local develop).
6) Classify findings OK / degraded / known-by-design per the do-not-alarm
   list in docs/monitoring.md. Write out/daily/<date>.md (15 lines max) and
   ALWAYS send the notification — all-clear too (2 lines is fine). The
   morning notification is the heartbeat; no notification means this
   automation died. Read-only commands otherwise; write ONLY under
   out/daily/, then prune it to the newest 30 files.
```

## The fast lane — StatusCake free (pending owner, ~15 min)

1. Free signup + email verification; one HTTPS monitor on
   `https://fropppy.github.io/gift-business/` with a keyword assertion on
   `Nhà Mai` set to fire when the string is **missing** (a 200-status error
   page still alarms); default 5-min interval; alerts to email + Telegram
   (Telegram needs bot/chat wiring).
2. Test-fire before trusting (~5 min): temporary second monitor on a
   known-bad URL with a keyword that will not match → the alert must land in
   email (and Telegram) within ~5–10 min (2 confirmation rechecks by
   default) → then delete the temp monitor. Both fit inside the 10-monitor
   free tier. This is the only way to know the lane reaches the phone.
3. Quarterly: glance at the StatusCake dashboard — if the free tier silently
   changed, alerting degrades to the digest's ≤ 24 h worst case.

No surveyed monitoring service offers Zalo (verified across UptimeRobot,
Better Stack, StatusCake, Cronitor, Uptime Kuma's 110 providers). Email is
the guaranteed phone-delivery channel; Telegram the optional second. Zalo
stays for customers, not ops alerts.

## Alert flow

```text
site down / wrong content
 ├─ FAST  StatusCake probe (5-min, random region + 2 confirmation rechecks)
 │        → email + Telegram            [minutes, ~5–10 with confirmations]
 └─ SLOW  07:00 ZCode digest → in-app notification, sent EVERY run
          [≤ 24 h; content parity, deploy freshness, CI, classification]
```

On a fast-lane alert: open the link, check githubstatus.com, then the repo's
Actions tab. If the deploy is red, remediation is re-running the failed run
or `gh workflow run deploy.yml` (deploy.yml has `workflow_dispatch`) — the
monitor never auto-remediates, and any push/deploy action still goes through
the owner per AGENTS.md. A lone keyword alert plus a clean morning digest
means content-change-or-false-positive, not outage — check the live page
before panicking.

## Do-not-alarm list (canonical)

States correct by design — the digest classifies them known-by-design; never
flag them as incidents:

- **Placeholder contact data is LIVE** (`src/data/site.json:6-10`) until the
  owner swaps it ([operations.md](operations.md) § Replacing placeholder
  content). Its presence is not news; only its absence *after* an owner swap
  is.
- **`orderEndpoint` is `""`** (`src/data/site.json:16`) → the contact form
  runs its honesty-gate branch (`src/components/ContactForm.astro:138-143`).
  Never "test" the form expecting delivery. Once the webhook is live, flip
  the assertion: the honesty-gate string disappearing becomes expected.
- **Dependabot runs** (path `dynamic/dependabot/…`) **and Dependabot PRs**
  are routine GitHub automation — surface new ones informationally.
- **Theme auto-switching** (Nov–Feb → tet, Sep → trung-thu, localStorage
  override) is applied client-side; served HTML is identical year-round.
- **Sitemap has no `lastmod`** by design (`scripts/generate-sitemap.mjs:12-14`
  — a fabricated date is worse than none).
- **`/404` is deliberately excluded from the sitemap**
  (`scripts/generate-sitemap.mjs:46`); unknown paths returning 404 is correct
  behavior.
- **Local `dist/`** is build output — never diffed or alarmed on.
- **The Apps Script 302 hop** to `script.googleusercontent.com` (once the
  webhook is live) is normal and CSP-allow-listed on purpose (commit 8c2af58);
  a redirect to `accounts.google.com` HTML is the actual broken state.

**Webhook probe rule** (once `orderEndpoint` is live): the only sanctioned
probe is `GET <exec-URL>` expecting body `ok` (`apps-script/Code.gs:153-155`,
[SETUP.md](../apps-script/SETUP.md) §2), at most once daily. NEVER send
synthetic POSTs — the rate limit is 3 per 10 min per phone and every accepted
POST writes a real row into the family's Sheet.

## Residual risks (pending owner sign-off — named acceptor: Khanh)

1. **Single-carrier vantage.** Reachability verified from VNPT Hanoi plus one
   HCMC node only; Viettel and FPT are untested and not coverable at $0.
   Mitigations: StatusCake random-global probing (incl. Singapore), the
   Friday multi-node sweep, and loading the shop URL once from any
   Viettel/FPT phone when curious.
2. **Slow-lane delivery is in-app only.** A 07:00 finding waits until the
   owner opens the ZCode app. The alternative (@mention email via a GitHub
   Actions lane) is an ask-first CI change and a separate decision.
3. **Heartbeat is self-watched.** "No notification by ~07:30 = dead" needs
   the owner to notice the silence; it is not an external dead-man's-switch.
4. **Host mortality.** Digest history (`out/daily`, newest 30) lives and dies
   on one host — accepted because is-the-site-up and did-alerts-fire live
   outside it, on StatusCake and GitHub.

If risk 2 is unacceptable, the runner-up design (GitHub Actions scheduled
curl check) was rejected for: cron jitter (3–10 min typical, droppable at
peak), 60-day inactivity auto-disable (local `out/` writes never reach
GitHub), sharing GitHub's failure domain with the watched site, and being an
ask-first CI change. Full option table: `out/monitoring-proposal.md` §3.
