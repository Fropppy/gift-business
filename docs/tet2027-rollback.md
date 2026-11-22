# Tết Đinh Mùi 2027 — rollback runbook

The season recast (ADR-0011, design record
[docs/design-language.md](design-language.md) §12) goes live by
merging: there is no staging environment — a merge to main deploys to
GitHub Pages immediately. This runbook therefore ships BEFORE the
season's first merge. It reverses the recast only; it does not weaken
any gate (gates are never edited to pass — see ZCODE.md working rule
2).

## When to roll back

Roll back exactly when one of these is true:

- The owner sees a visual regression on the live site (broken hero
  art, wrong palette, ornament rendering damage) that a content fix
  cannot address.
- A gate breaks post-merge: the CI `check` job red on a PR, the Pages
  deploy failing, or the deploy smoke job red on main.

If the problem is a typo, a wrong price, or wording — that is a
content fix, not a rollback. During the fulfillment freeze (below),
that distinction is the whole ballgame.

## The exact sequence

Run from an up-to-date local main.

1. **Revert the merge commit on main.**
   `git revert -m 1 <merge-commit-sha>` — the `-m 1` is required
   because the season work landed as a merge commit; the revert
   produces one commit undoing the whole merge.
2. **Open a revert PR against main and wait for CI `check` green.**
   check.yml triggers on pull_request only — pushing to main produces
   no CI run — and main's branch protection requires the `check`
   status context. Match the run's head SHA to the revert commit
   before citing it as verified (ZCODE.md project fact: cite CI runs
   by head SHA, not recency).
3. **Merge the revert PR.** This push to main triggers deploy.yml.
4. **Watch the Pages deploy succeed.** The deploy workflow run must
   finish green; the site is re-published from the reverted tree.
5. **Confirm the deploy smoke job is green.** deploy.yml's smoke job
   checks the live route set against its own expectation; red here
   means the revert exposed a route-count coupling — stop and read
   before touching anything else.

Commit nothing else in between: the revert must be the only change
the deploy carries, so the verification below proves the rollback and
not some other edit.

## Post-rollback verification

Both checks run against the LIVE site, not dist/.

1. **Homepage serves and carries the CSP meta:**

   ```bash
   curl -s https://fropppy.github.io/gift-business/ | grep -i 'http-equiv="Content-Security-Policy"'
   ```

   One hit expected. No output means the wrong page (or a 404 page)
   came back — do not proceed on assumptions.

2. **The served CSS no longer carries the new tet values.** Grab the
   stylesheet URL from the homepage HTML, fetch it, and count the
   season's values:

   ```bash
   curl -s https://fropppy.github.io/gift-business/ | grep -o 'href="[^"]*\.css"' | head -1
   curl -s <that-css-url> | grep -c -e fbeae6 -e 961914 -e 7c130f -e b73927 -e ecd9c9 -e dfc7b3
   ```

   Expected count after a clean rollback: `0`. For contrast, the same
   grep on the pre-rollback CSS returns hits for every value. As a
   second signal, the ornament classes should be gone too:
   `grep -c 'tet-divider\|price-rule'` over the CSS returns 0 after
   the revert. If the old tet values (`fdf3e7`, `c0272d`) appear in
   the fetched CSS, the pre-recast theme is back — that is the state
   you want.

If both checks pass, the rollback is done. Report it with the exact
commands and outputs, per ZCODE.md working rule 9.

## The freeze note

2027-01-20 to ~2027-02-15 is order-fulfillment season: the family is
shipping gift baskets, not reviewing pull requests. **Content fixes
only** land in that window — a rollback is reserved for a broken live
site, and re-landing any revised season work waits until the window
closes. The runbook itself stays valid inside the window: a broken
live site during peak season is exactly when the sequence above must
work as written.
