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

## Rolling back the Stage S1 special layer

The special layer (ADR-0012; design record
[docs/design-language.md](design-language.md) §13) adds six things on
top of the 2026-11-21 recast, and a surgical rollback must account
for each:

1. **The append block** — one contiguous region at the end of
   `src/styles/global.css`, from the header comment "APPENDED for the
   Tết hộ-mệnh special layer" (`global.css:2540`) through end of file
   (`:2746`). It can be deleted as one unit.
2. **The porcelain swap** — tet `--bg` `#fbeae6` → `#fffef1`, a
   same-line swap inside the tet token block (`global.css:98`). It
   does NOT ride the append-block deletion: it must be swapped back
   in the same change, or the body ground changes with the layer
   already gone.
3. **The Fraunces segment** of the single css2 link
   (src/layouts/BaseLayout.astro:102).
4. **The year-wordmark markup** (src/components/Hero.astro:16). Its
   `display: none` default lives INSIDE the append block — delete the
   block without this line and an unstyled "Đinh Mùi 2027" renders in
   every theme, base included.
5. **The band eyebrow + lead copy** (src/pages/index.astro:51 and :53) —
   reverting restores the pre-S1 wording (the old lead carried the
   "huy hiệu" phasing this stage retired).
6. **The three hero SVGs** (hero-tet-1/2/tile.svg) — replaced in
   place, so the pre-S1 art comes back with the revert.

The clean rollback is therefore git-level, not surgical:

- **Before the Stage S1 commit is pushed:** `git revert
  <stage-s1-sha>` on develop — one commit undoing all six things at
  once; the porcelain swap rides the same revert.
- **After S1 reaches main:** run the exact revert-PR sequence above
  against the merge commit that carried S1. As before, the revert
  must be the only change the deploy carries.

**Post-rollback verification, S1 delta.** The CSS check above still
works, with one drift to know about: once S1 ships, `#fffef1` is the
tet ground and `#fbeae6` exists nowhere in the served CSS. So after
an S1-only revert the expected state is `fffef1` gone, `fbeae6` back,
and the recast values (`961914`, `7c130f`, `b73927`, `ecd9c9`,
`dfc7b3`) still present — that is the correct pre-S1 season look, NOT
a failed rollback; a full-season rollback (S1 revert plus the
recast-merge revert) is what returns the expected count to 0 for
every value. The special layer's own clean marker is its unique
class: `grep -c 'tet-year-wordmark'` over the served CSS and the
homepage HTML returns 0 after the S1 revert (the `.tet-band` class
predates S1 — its base wash rule landed with the 2026-11-21 recast —
so `tet-band` is not an S1 marker). As above, run both checks against
the LIVE site and report exact commands and outputs.

## The freeze note

2027-01-20 to ~2027-02-15 is order-fulfillment season: the family is
shipping gift baskets, not reviewing pull requests. **Content fixes
only** land in that window — a rollback is reserved for a broken live
site, and re-landing any revised season work waits until the window
closes. The runbook itself stays valid inside the window: a broken
live site during peak season is exactly when the sequence above must
work as written.
