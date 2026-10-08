# Nhà Mai — Design Language

**Status:** implemented · **Date:** 2026-10-06 · **Stack:** Astro static, GitHub Pages (`astro.config.mjs:13-16`: `site: fropppy.github.io`, `base: /gift-business`, no adapter — pure static output)

This document turns four research studies (2026 ecommerce trends, gift-retail conversion patterns, theme-switching mechanics for this exact stack, Vietnamese cultural design cases) into one buildable design language for Nhà Mai. It is an **evolution of what already exists** — the current cream/pine/terracotta token system (`src/styles/global.css:10-42`) is kept and extended, not replaced.

Everything below is implementable in plain Astro + CSS custom properties. No framework, no JS animation library, no server.

**Checks run in this session (all by the author of this doc):**

- `npm run build` → `[build] 21 page(s) built … Complete!` — baseline green.
- WCAG contrast audit (node script, WCAG 2.x relative-luminance formula) over rest, hover, and focus-ring pairs **per theme** — full table in §3.4. The current site fails **nine pairs**: white on `--accent` fill 3.62:1 (`.btn--accent` rest, `global.css:185-190`); `--accent` as text on cream/white 3.36/3.62 (`.eyebrow`, `.link-more`, `.card-zalo`); `--accent-deep` `#b25d22` as text on cream 4.35 (`a:hover` on page bg, `global.css:107`); and in the Tết theme today: eyebrow gold `#c89b3c` on `#fdf3e7` 2.33, gold on white 2.56, `a:hover` `#b0872f` on tet bg 3.01 and on white 3.31, and the focus ring (gold in-theme) at 2.33/2.56 against the 3:1 non-text minimum. The revised token set in §3.1 clears every pair (§3.4). An independent reviewer's audit of this document (different sRGB linearization constant) differs by ≤0.08 on every pair with identical pass/fail verdicts throughout.
- Data counts (node, this session): 16 products; **8 tagged `tet`** (`prod_nm_001, 004, 005, 006, 007, 008, 012, 013`); **14 `personalization.type: "handwritten-card"`** + **2 `logo-and-card`** (`prod_nm_007`, `prod_nm_008`); price spread 350,000–1,450,000 VND landing **4 / 10 / 2** in the bands <500k / 500k–1tr / ≥1tr (all bands populated).
- Read `src/components/Testimonials.astro` and `.github/workflows/deploy.yml` to verify two fit claims: the shipped testimonials are explicitly placeholders (`Testimonials.astro:4` — "SAMPLE REVIEWS — placeholder testimonials (no real customers yet)"), and the deploy workflow uses `withastro/action@v6` (`deploy.yml:20`) whose own comment (`:21`) states it does install + build + artifact upload in one step — it cannot run a custom node script, and it triggers on `push` only (`deploy.yml:3-5`).
- Google Fonts CSS fetched with a full Chrome UA: both `Playfair Display` and `Be Vietnam Pro` ship dedicated `/* vietnamese */` `@font-face` blocks (`unicode-range: U+0102-0103, U+0110-0111, … U+1EA0-1EF9, U+20AB`). Note for re-verification: a bare `Mozilla/5.0` UA gets the legacy TTF response *without* subsets — use a real browser UA string.
- `grep dist/index.html`: exactly 1 `setAttribute('data-theme', 'tet')` call and exactly 1 plain `<script>` tag — the `is:inline` head script (`src/layouts/BaseLayout.astro:41-78`) survives the build as a synchronous, pre-paint script. FOUC guard confirmed in the artifact, not just in source.

**Codebase read for this document:** `src/styles/global.css` (1089 lines), `src/layouts/BaseLayout.astro`, `src/components/{Hero,ProductCard,ProductGrid,Header,ContactForm,OccasionStrip,CategoryGrid,Commitments,Steps,SectionHead,CTA,Footer,Testimonials}.astro`, `src/pages/{index,about,contact,404,products/index,products/[slug]}.astro`, `src/data/{site,products,occasions,categories}.json`, `astro.config.mjs`, `src/utils/catalog.ts`.

---

## 1. Design principles

Six principles. Each is a decision with a research trail, not a slogan.

### 1.1 — Type carries the story; imagery decorates it

**Decision.** The hero and every section head are editorial type compositions — oversized Playfair Display Vietnamese headlines over a quiet workhorse UI face, with one concrete promise per surface. Photography/SVG art fills secondary panels, never pretends to be a full-bleed photo the shop can't produce.

**Why.** The trends study rates typography-led editorial layouts *rising* (multiple independent 2026 sources; type "taking center stage") and notes it is the cheapest visual device for a shop with no photoshoot budget, and fast-loading on static hosting. The gift-patterns study's anti-pattern #3 is explicit: "a family shop whose images are SVG must NOT build a photo-style hero it can't fill — lean on bold type, seasonal color, and one concrete promise instead," because in gifting *the recipient sees the real basket* and a photo/asset mismatch breaks trust. The current hero already works this way on a small scale (strong Vietnamese headline + promise at `src/components/Hero.astro:17-25`); this principle scales it up rather than replacing it.

### 1.2 — One saturated accent; red stays quarantined in Tết

**Decision.** Year-round identity = cream field, pine structure, one terracotta accent. Crimson `#c0272d` + gold appear **only** inside `[data-theme='tet']` (`global.css:48-58`) and in the single year-round exception: the HOT badge (`global.css:243`) and the form error color. No red enters the base palette, ever, including under "make it pop" pressure.

**Why.** The culture study calls keeping red seasonal "the single biggest anti-tourist decision" and ranks red+gold-as-year-round-identity the #1 airport-souvenir signal. The trends study's 2026 color consensus is exactly our architecture: muted warm base + one bold accent (and dark mode explicitly out: warm gift branding reads poorly on it). The current token split already implements this — the principle is to defend it.

### 1.3 — Sell the moment and the contents, not the SKU

**Decision.** Navigation is occasion-first (the `OccasionStrip` / `occasions.json` mechanism is the primary merchandising axis), cards lead with a descriptive name + recipient subtitle + an itemized "gồm những gì" contents line, and the catalog offers price-tier chips (dưới 500k / 500k–1tr / trên 1tr) as the domestic convention.

**Why.** Gift buyers arrive knowing the occasion and the relationship, not the product (gift-patterns: occasion-first navigation converts the anxious buyer). The Vietnamese price-band convention exists because "in biếu culture the budget band IS the decision — quà phải đúng mức." The contents manifest is "the single best pattern for a placeholder-image site: text sells the gift while the SVG decorates it." `products.json` already gets card naming right ("Giỏ trái cây nhập khẩu cao cấp" / subtitle "Biếu sếp & đối tác") versus the domestic anti-pattern ("Giỏ Quà Tết Q50"). Descriptions already enumerate contents in prose ("Nho Mỹ, cherry, việt quất, kiwi xanh…") — the decision is to promote that to structured data and a dedicated card/PDP line.

### 1.4 — Reassurance sits where the decision happens

**Decision.** The gifting-reassurance cluster — gói đẹp miễn phí, thiệp viết tay, giao đúng hẹn, human contact with a 30-minute reply — renders as a persistent strip directly under the hero and again beside/above every contact point. The handwritten thiệp (`products.json` `personalization.type: "handwritten-card"` on 14 of 16 products; the two corporate products `prod_nm_007`/`prod_nm_008` use `logo-and-card`, which still includes the thiệp — the card promise holds shop-wide) is the lead personalization signal in hero copy, cards, and PDP, because it is the one asset a family shop has that printed corporate cards don't.

**Why.** "The sender pays but isn't present at delivery — every fear (will it look cheap? arrive late? include a card?) must be answered where the add-to-cart happens" (gift-patterns, reassurance badge strip; the VN sites put FREE SHIP / ĐÓNG GÓI strips at the very top). The site already promises all of this in copy (`site.json:4-5`, `Commitments.astro`, hero tile `Hero.astro:53-62`) — the decision is placement and repetition discipline, and never rendering proof we don't have. That last clause indicts something already shipped: the homepage testimonials are invented — `Testimonials.astro:4` is commented "SAMPLE REVIEWS — placeholder testimonials (no real customers yet)" with named fake customers (`:10-23`) and a "5 trên 5 sao" star rating (`:39`). This principle requires their removal (decision and plan step in §6.3/§7 step 6), consistent with the research's anti-patterns #4–5 (borrowed authority, inflated/empty social proof: "a small site with a bare '0 reviews' widget or invented counts looks worse than none").

### 1.5 — Accessibility is structural, fixed while the site is young

**Decision.** 4.5:1 minimum on all text pairs (with the accent fix in §3.1), visible `:focus-visible` rings (already `global.css:113-117`), persistent form labels (already — labels never collapse to placeholders, `ContactForm.astro:23-38`), meaningful Vietnamese alt text (already, with honest "Ảnh minh họa" prefixes), no color-only status, and `prefers-reduced-motion` honored globally (already `global.css:1081-1088`). The one motion gap found — the hero rotation timer kept running for reduced-motion users because the duration kill cannot stop a `setInterval` — is resolved structurally in §5.3 by dropping the carousel; the rule (any future timer gates on `prefers-reduced-motion`) stands.

**Why.** The trends study rates accessibility-driven choices *rising* with enforcement building (EAA applies to EU-facing sellers since June 2025; US ADA suits +~20% in 2025) and notes the cheap moment is now, while building. My own contrast audit (this session) found the one failing pair — proving the audit belongs in the workflow, not just the values.

### 1.6 — Motion is feedback, in CSS only

**Decision.** All motion is CSS transitions of 120–700ms on transform/opacity/color/shadow: hover lifts ≤3px, card Zalo-CTA reveal, theme swap, imagery crossfades. No scroll-jacking, no cursor effects, no animation libraries, no autoplaying carousels (the hero becomes a single static composition — §5.3).

**Why.** Trends study: micro-interactions are at peak and the *heavy* variants "usually fail" the does-it-help-the-shopper test and hurt INP; on a static site prefer CSS to protect load time, and older non-technical gift shoppers are the core audience. The current site already obeys this (every animation in `global.css` is a short transition; the only JS timer is the hero rotation).

---

## 2. Theme system

### 2.1 Recommendation

**Extend the existing `data-theme` attribute on `<html>` + `is:inline` head script.** This is the switcher study's recommended approach, and the codebase confirms its premises:

- The mechanism is already shipped: `BaseLayout.astro:59-61` sets `data-theme="tet"` in-season; `global.css:48-58` re-skins via tokens only; a third theme is already sketched in comments (`global.css:60-64`).
- It works on pure static GitHub Pages (no server, verified: `astro.config.mjs` has no adapter) — cookie/serverless render-time theming is impossible here by definition.
- FOUC prevention is verified end-to-end in the built artifact (this session: `dist/index.html` contains exactly one plain `<script>` tag — the theme logic, executing synchronously before first paint).
- One attribute value = single source of truth that cannot half-apply, unlike class add/remove pairs.

Rejected alternatives (per the switcher study): body-class strategy (namespace collisions, half-applied states, would require rewriting existing `[data-theme]` rules for zero gain), `prefers-color-scheme` layering (binary; our themes are all light seasonal palettes — keep it only as the lowest-priority fallback tier if a dark theme ever exists), cookie/SSR (impossible on this host), alternate stylesheets (obsolete, duplicates whole stylesheets).

### 2.2 Named themes (registry)

| id | Label (UI only) | When | Justification |
|---|---|---|---|
| `base` | *Mùa thường* (implicit default) | Always, when nothing else applies | The complete brand palette — cream/pine/terracotta (`global.css:10-42`). Carries every token; the no-JS world only ever sees this. |
| `tet` | **Tết** | Auto Nov–Feb (`BaseLayout.astro:59-60` already checks months 11, 12, 1, 2) + manual any time | Existing, shipped, verified in `dist/`. Tết is the demand curve for a Vietnamese gift shop (`products.json`: 8 of 16 products tagged `tet` — node count this session). Crimson field + antique gold (`global.css:48-58`). |
| `trung-thu` | **Trung Thu** | Auto September + manual any time | **New — justified:** a real catalog moment (`products.json` `prod_nm_016` "Set quà Trung Thu sang trọng", tags `trung-thu`; `occasions.json:5` "Tết Trung Thu — Tháng 9"), a theme block already sketched at `global.css:60-64`, and moon-gold on warm grey is the same muted-recolor move the culture study endorses (Thai SACIT: recoloring traditional motifs into a restrained palette "de-tourists" them). |

Theme ids are machine strings used verbatim as attribute values; Vietnamese display labels live only in the switcher UI. The whitelist exists in exactly two places by necessity (the `is:inline` script cannot import — Astro docs): the head script and the switcher component. Adding a theme = edit `global.css` block + whitelist array + one switcher button.

### 2.3 Token layering (4 layers)

- **L1 — `:root`** = the base theme AND the completeness contract. Every token has a value here, so theme blocks stay sparse and no-JS never renders a hole. See §3.
- **L2 — `[data-theme='x']` sparse overrides.** Tết and Trung Thu each override 12 tokens (the accent role set + primary ramp + bg + borders). Never layout or typography — themes are palette registers only (the Tết block's own comment, `global.css:44`, states "tokens only — zero layout/typography changes"; keep that rule).
- **L3 — component-scoped theme rules.** Currently exactly two exist (`[data-theme='tet'] .badge--hot` at `global.css:249` — the lì-xì envelope tag reshape — and `[data-theme='tet'] .price` at `:678`). Keep this layer at ~zero; if a third instance appears, promote a token instead.
- **L4 — runtime-set tokens** (`--motif-image`, `--motif-opacity`, `--hero-1/2/tile`), set as inline style on `<html>` from the head script because a CSS `url()` cannot carry `import.meta.env.BASE_URL` and `public/` assets need the `/gift-business` prefix (documented at `BaseLayout.astro:44-49`). This stays JS-side; it is correct.

Color values live **only** in `global.css` (the file's own header rule, `global.css:2-4` — honor it).

### 2.4 Switcher UX

- **Where:** in the Header. Desktop: between the nav block and the hotline block — in real DOM terms, after `.site-nav` (whose last child is the Zalo CTA, `Header.astro:28-35`) and before `.header-hotline` (`Header.astro:37-40`); that slot exists in today's DOM and needs no re-ordering. Mobile: inside the `site-nav` panel so it never crowds the 900px-and-below bar (`global.css:334-358`).
- **Control:** three buttons — `Tự động` · `Tết` · `Trung Thu` — each with `aria-pressed` derived from the same attribute the head script sets, so the button can never claim a theme that isn't rendered. Not a `<select>` (buttons show state at a glance and match the `.chip` visual language).
- **Persistence:** `localStorage` key `nm:theme` (strings only, wrapped in try/catch — `localStorage` can throw `SecurityError` when persistence is blocked). Choosing a concrete theme stores its id; choosing *Tự động* removes the key and returns control to the calendar.
- **L4 behavior — what a switch actually does.** v1 applies a choice by writing/removing the key and calling `location.reload()`. Reason: beyond colors, the seasonal dressing is carried by **L4 runtime tokens set once at page load** — `--hero-*` year-round (`BaseLayout.astro:55-57`), `--motif-*` (`:62-63`), and the Tết hero art probes (`:68-75`) — so a live attribute flip re-skins colors only and leaves stale art: picking `base` in November would keep the hoa-mai watermark over pine/cream, and picking `tet` in July would get crimson without watermark or hero art. Because the site has no client-side router (§2.5 rule 4), every navigation is already a full page load — a reload is indistinguishable from normal navigation here. If a no-reload switch is ever wanted, factor the head script's effective-theme logic into a shared `applyTheme(id)` the switcher also calls, including `root.style.removeProperty('--motif-image')` / `('--motif-opacity')` for base/trung-thu and re-running the hero-tet `Image` probes for tet — at the documented cost of a third copy of the theme whitelist.
- **Hidden when JS can't run:** default `.theme-switch { display: none }`; the head script sets `data-theme-ui="on"` on `<html>` and CSS gates `[data-theme-ui='on'] .theme-switch { display: flex }`. Inert buttons would be worse than absent ones.

### 2.5 FOUC prevention

The guard is already correct: the `is:inline` script sits in `<head>` (`BaseLayout.astro:41`), Astro renders such scripts into the HTML exactly as written, and a plain non-module script executes synchronously as the parser reaches it — before the body exists. Verified this session in the artifact (single plain `<script>` in `dist/index.html`).

Rules that keep it correct:

1. **Do not move this logic into a default Astro `<script>`** — processed scripts become `type="module"`, which defers execution until after parsing and reintroduces the flash.
2. Read storage synchronously and microsecond-cheap; because `body` already consumes tokens (`global.css:77-85`), first paint resolves in the right theme with no repaint.
3. Validate any stored/URL value against the whitelist before `setAttribute` — never write an unvalidated string to the DOM.
4. No `ClientRouter`/View Transitions is imported today, so every navigation is a full load and the head script re-runs. If client-side routing is added later, re-apply the theme on `astro:after-swap`.

### 2.6 No-JS fallback

Already safe by construction and it stays that way: without JS no attribute is set and every page renders the complete `:root` base theme — a designed palette, not a broken one; every component consumes tokens only, so nothing is unstyled, only unthemed. Accept explicitly that the seasonal re-skin is an enhancement, not a guarantee: crawlers and no-JS visitors see the base brand year-round. The switcher is hidden via the `data-theme-ui` gate (§2.4).

Two hardening additions: declare `--hero-*`/`--motif-*` defaults in `:root` (done in §3 — they already default to `none`/`0` at `global.css:29-30`) and set `color-scheme: light` in `:root` plus `<meta name="color-scheme" content="light">` in `BaseLayout` so UA form controls match the palette (grep confirms no `color-scheme` exists today despite `ContactForm`'s native inputs).

### 2.7 Precedence: manual choice vs the Nov–Feb auto Tết

Resolved entirely inside the one inline head script, before first paint, computing **one effective theme id** and setting **one attribute**:

```
1. stored manual choice   localStorage['nm:theme'] ∈ whitelist  → use it
                          (any concrete id, incl. 'tet' in July, 'base' in December)
2. seasonal auto          month ∈ {11,12,1,2} → 'tet'
                          month === 9         → 'trung-thu'   (approximation — see note)
3. default                'base'
```

- A user who picks `base` in December keeps base — explicit choice outranks the calendar.
- A user who picks `tet` in July gets the full Tết dressing (colors **and** hoa-mai watermark **and** hero swap): move the existing motif/hero side-effects (`BaseLayout.astro:62-75`) inside `if (effective === 'tet')` so one code path fires regardless of source.
- *Tự động* removes the key and hands control back to the calendar.
- The switcher highlights the stored choice when present, otherwise *Auto*.
- **Honest limitation:** month === 9 is a Gregorian approximation of rằm tháng 8 âm lịch, which occasionally falls in early October. The manual switch is the escape hatch; do not add lunar-calendar math to a head script for v1.
- **Optional later (switcher study extension):** accept `?theme=tet` via `URLSearchParams` in the same script (whitelisted, applied once, optionally persisted) to give Tết/Trung Thu campaign links and QR codes their own skin — pure static, no server.

---

## 3. Tokens

### 3.1 Color

The base block, with fixes and additions marked. Existing names are kept (semantic, never raw color names; the `*-ink` pairs are what let a theme change a fill without touching components).

```css
:root {
  color-scheme: light;

  /* palette — base "Mùa thường" */
  --bg: #faf6ef;             /* Kem Giấy — page background */
  --surface: #ffffff;        /* Trắng Tuyết — cards, sheets */
  --primary: #1e5c46;        /* Xanh Thông — CTAs, links, wordmark */
  --primary-deep: #16473a;   /* primary hover */
  --primary-ink: #ffffff;    /* text on primary */
  --accent: #c96f2f;         /* Cam Đất — DECORATIVE ONLY: borders, chip hover borders,
                                large display numerals. Not text-safe (3.36:1 on cream). */
  --accent-strong: #a1501a;  /* NEW — accent AS TEXT on light: 5.30:1 cream, 5.71:1 white.
                                Eyebrows, .link-more, .card-zalo. */
  --accent-deep: #8a4418;    /* CHANGED (was #b25d22 — only 4.35:1 as text on cream) —
                                accent TEXT hover: 6.67:1 cream. a:hover, .chip:hover,
                                .link-more:hover (global.css:107, 223, 483, 582). */
  --accent-fill: #a1501a;    /* NEW — .btn--accent fill (white ink 5.71:1). Same value as
                                --accent-strong in this white-ink theme; the roles split
                                in the dark-ink seasonal themes, where a hex that is
                                text-safe is not fill-safe (or vice versa). */
  --accent-fill-hover: #8a4418; /* NEW — .btn--accent:hover fill (white ink 7.19:1). */
  --accent-ink: #ffffff;     /* text on --accent-fill */
  --tet: #c0272d;            /* Đỏ Tết — HOT/flash tags, form errors; fills only in tet theme */
  --gold: #c89b3c;           /* Vàng May — antique/matte gold, never bright foil */
  --gold-ink: #2b2118;       /* text on gold */
  --text: #2b2118;           /* Mực Cacao */
  --muted: #6c6053;          /* secondary text — 5.67:1 on cream */
  --border: #e7dcc8;         /* Viền Sương */
  --border-strong: #d8cbb8;  /* Viền Sương, hover */
  --scrim: 43, 33, 24;       /* NEW — rgb triplet for hero scrims: rgba(var(--scrim) / .62) */

  /* runtime hooks (set by the head script; defaults declared here) */
  --motif-image: none;
  --motif-opacity: 0;
  --hero-1: none;
  --hero-2: none;
  --hero-tile: none;
}
```

Theme blocks — sparse, colors only:

```css
[data-theme='tet'] {
  --bg: #fdf3e7;
  --primary: #c0272d;        /* white ink 5.88:1 */
  --primary-deep: #a11f26;   /* white ink 7.67:1 */
  --primary-ink: #ffffff;
  --accent: #c89b3c;         /* decorative gold: seals, ribbons, borders */
  --accent-strong: #7a611f;  /* gold AS TEXT on #fdf3e7: 5.38:1. NOT #b0872f — that is
                                3.01:1 as text here; it is the fill value below. */
  --accent-deep: #6a541d;    /* gold text hover on #fdf3e7: 6.61:1 */
  --accent-fill: #b0872f;    /* .btn--accent fill, cocoa ink 4.76:1 */
  --accent-fill-hover: #c89b3c; /* Hover fill is LIGHTER here (cocoa ink 6.16:1). In a
                                dark-ink theme a lighter fill raises contrast; the
                                base-theme instinct (darker hover) would lower it. */
  --accent-ink: #2b2118;     /* dark ink on gold fills — white on gold fails AA */
  --border: #ebd9c3;
  --border-strong: #dec9ae;
}

[data-theme='trung-thu'] {   /* NEW — activates the sketched block at global.css:60-64 */
  --bg: #f4f1ea;             /* moonlit paper */
  --primary: #1e3a5f;        /* night blue — white ink 11.50:1 */
  --primary-deep: #162c49;
  --primary-ink: #ffffff;
  --accent: #c89b3c;         /* moon gold, decorative */
  --accent-strong: #7a611f;  /* on #f4f1ea: 5.23:1 */
  --accent-deep: #6a541d;    /* on #f4f1ea: 6.42:1 */
  --accent-fill: #b0872f;    /* cocoa ink 4.76:1 */
  --accent-fill-hover: #c89b3c; /* cocoa ink 6.16:1 */
  --accent-ink: #2b2118;
  --border: #ddd6c6;
  --border-strong: #cbc2ad;
}
```

**Usage rules.**
- **Accent role map (the polarity rule):** `--accent` decorative; `--accent-strong` accent *text* on light bg (`.eyebrow`, `.link-more`, `.card-zalo`); `--accent-deep` accent *text* hover (`a:hover`, `.chip:hover`, `.link-more:hover`); `--accent-fill` / `--accent-fill-hover` the `.btn--accent` fill pair with `--accent-ink`. In the white-ink base theme, deeper = safer for every role. In the cocoa-ink seasonal themes the roles pull apart: text wants a *darker* gold (`#7a611f`/`#6a541d`) while fills want a *lighter* one (`#b0872f` → hover `#c89b3c`) — hence fill and text are separate tokens, and `#b0872f` must never serve as text on a seasonal bg (3.01:1 on `#fdf3e7`, verified).
- `--tet` is a fill only inside the tet theme; year-round it is badge/error color only (white on `#c0272d` = 5.88:1 — passes).
- Gold: one gold element per surface (the seal, one line, one ribbon) — antique/matte register per the culture study (Marou's silk-screen antique gold ink; our `#b0872f`/`#c89b3c` are exactly this register).
- `.price` in tet theme keeps `var(--tet)` (`global.css:678`; crimson on tet bg = 5.37:1 ✓).

### 3.2 Type scale, spacing, radius, shadow, motion, layout

```css
:root {
  /* type */
  --font-display: 'Playfair Display', Georgia, 'Times New Roman', serif;
  --font-body: 'Be Vietnam Pro', 'Segoe UI', system-ui, -apple-system, sans-serif;
  --font-size-xs: 0.75rem;                            /* badges, .card-cat */
  --font-size-sm: 0.875rem;                           /* .card-desc, notes */
  --font-size-base: 1rem;                             /* body — 16px floor, never lower */
  --font-size-lg: 1.125rem;                           /* .lead */
  --font-size-xl: clamp(1.6rem, 3.4vw, 2.35rem);      /* h2 */
  --font-size-2xl: clamp(2rem, 4.75vw, 3.125rem);     /* h1 on inner pages */
  --font-size-display: clamp(2.25rem, 6vw + 1rem, 5rem); /* hero display — §4.2.
                                At 390px viewport ≈ 39.4px (2.46rem) — floor and viewport
                                rate unchanged by the 2026-10-07 quiet-luxury pass; only the
                                cap rose 4.5rem → 5rem for the desktop scale. The 390px
                                rendering is unchanged by construction, re-checked 2026-10-07
                                per the §4.2 fit note */
  --leading-tight: 1.15;                              /* display headlines */
  --leading-body: 1.65;
  --tracking-caps: 0.14em;                            /* .eyebrow, .badge */

  /* space — 4px base scale (maps the values already hardcoded in components) */
  --space-1: 0.25rem;   /* icon gaps */
  --space-2: 0.5rem;    /* chip/badge gutters */
  --space-3: 0.75rem;   /* card body rows */
  --space-4: 1rem;      /* card padding unit */
  --space-5: 1.5rem;    /* grid gaps */
  --space-6: 2.25rem;   /* card padding, section head offset */
  --space-7: 3.5rem;    /* section padding start */
  --space-8: 5rem;      /* section padding max / footer top */

  /* radius & depth */
  --radius: 14px;        /* cards, chips-rect, steps */
  --radius-lg: 22px;     /* hero panels, forms */
  --radius-pill: 999px;  /* buttons, chips — currently hardcoded at global.css:165,211 */
  --shadow-soft: 0 10px 30px rgba(43, 33, 24, 0.08);
  --shadow-lift: 0 16px 40px rgba(43, 33, 24, 0.14);

  /* motion */
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --dur-fast: 120ms;    /* hovers, chips, zalo reveal */
  --dur-base: 200ms;    /* buttons, cards, theme swap */
  --dur-slow: 700ms;    /* imagery crossfades (PDP/occasion art; matches the old hero fade, global.css:381) */

  /* layout */
  --container: 1140px;
  --container-prose: 640px;   /* prose measure ≈ 70 chars — matches .section-head (global.css:142) */
}
```

**Token count:** the `:root` base layer declares **55 custom properties** (19 color incl. scrim + 5 runtime hooks + 12 type + 8 space + 3 radius + 2 shadow + 4 motion + 2 layout). `[data-theme='tet']` overrides **12**, `[data-theme='trung-thu']` **12**. Migration is gradual: existing hardcoded values in components map 1:1 onto these (e.g. `padding: 1rem 1.1rem` ≈ `--space-4 --space-4*1.1` — snap to the scale where the delta is invisible).

### 3.3 Accessibility contract for tokens

- Any `*-ink` token paired with its fill must clear 4.5:1 **in both states and both polarities**: white-ink themes deepen fills on hover; dark-ink (cocoa-on-gold) themes *lighten* them. Every fill token is audited with its hover token, not alone.
- Accent text tokens are audited against **both** `--bg` and `--surface` per theme, because accent text sits on page backgrounds (eyebrows) and on white cards (`.link-more`, `.card-zalo`) — a value can pass on one and fail on the other.
- `--accent` is *not* text-safe on light backgrounds (3.36:1); text roles use `--accent-strong`, text hovers use `--accent-deep`. `--accent-fill`/`--accent-fill-hover` are fill-only.
- Focus rings: `:focus-visible { outline: 3px solid var(--primary) }` — sourced from `--primary` **in every theme** (base 7.29:1 on cream / 7.85:1 on white; tet 5.37 / 5.88; trung-thu 10.2 / 11.5 — all clear the 3:1 non-text minimum with margin). The accent route fails in seasonal themes: today's ring is in-theme gold `#c89b3c` at 2.33:1 on tet bg, and even `#b0872f` is only 3.01:1 on tet bg and 2.93:1 on trung-thu bg. Exception: focusable elements on dark media/scrim panels get `outline-color: #fff` (a `--primary` ring can vanish over dark imagery).
- No color-only status: `.form-status` variants already pair color with distinct text (`ContactForm.astro:108-114`); keep words + color, never color alone.
- `scripts/contrast.mjs` (plan step 1) must check **selector-level pairs** — each rendered (selector, state, theme) combination, rest *and* hover, ring against both `--bg` and `--surface` — not bare token pairs, or hover-state and per-theme failures stay invisible in CI.

### 3.4 Contrast audit (run this session — keep as a checklist)

All ratios computed this session with the WCAG 2.x relative-luminance formula (node). An independent reviewer re-ran the audit with a slightly different linearization constant; every pair agrees within ≤0.08 with identical pass/fail verdicts.

**Current site — failing pairs (what step 1 fixes):**

| Selector (state, theme) | Ratio | Needs |
|---|---|---|
| `.btn--accent` rest — white on `#c96f2f` | 3.62 | 4.5 ✗ |
| `.eyebrow` on bg / `.link-more`, `.card-zalo` on surface — `#c96f2f` as text | 3.36 / 3.62 | 4.5 ✗ |
| `a:hover`, `.chip:hover`, `.link-more:hover` on page bg — `#b25d22` as text | 4.35 | 4.5 ✗ |
| tet theme `.eyebrow` / hero-tile accent — `#c89b3c` as text on `#fdf3e7` / white | 2.33 / 2.56 | 4.5 ✗ |
| tet theme `a:hover` etc. — `#b0872f` as text on `#fdf3e7` / white | 3.01 / 3.31 | 4.5 ✗ |
| `:focus-visible` ring in tet theme — `#c89b3c` on `#fdf3e7` / white | 2.33 / 2.56 | 3.0 (non-text) ✗ |

**Revised token set — every rendered pair, verified:**

| Pair (state, theme) | Ratio | Verdict |
|---|---|---|
| `--text` on `--bg` / `--surface` (all themes: 14.36–15.75) | 14.62 / 15.75 | ✓ |
| `--muted` on `--bg` / `--surface` (all themes: 5.57–6.11) | 5.67 / 6.11 | ✓ |
| `--primary` link on `--bg` / white — base 7.29 / 7.85 · tet 5.37 / 5.88 · trung-thu 10.2 / 11.5 | — | ✓ |
| `--primary-ink` on `--primary` / `--primary-deep` — base 7.85 / 10.52 · tet 5.88 / 7.67 | — | ✓ |
| `--accent-strong` as text — base on cream/white 5.30 / 5.71 · tet `#7a611f` on bg/white 5.38 / 5.90 · trung-thu 5.23 / 5.90 | — | ✓ |
| `--accent-deep` as text-hover — base on cream 6.67 · tet `#6a541d` on bg 6.61 · trung-thu 6.42 | — | ✓ |
| `.btn--accent` fill — base `#a1501a` + white 5.71 · tet/thu `#b0872f` + cocoa 4.76 | — | ✓ |
| `.btn--accent:hover` fill — base `#8a4418` + white 7.19 · tet/thu `#c89b3c` + cocoa 6.16 | — | ✓ |
| `--gold-ink` on `--gold` | 6.16 | ✓ |
| white on `--tet` (badges; tet primary) | 5.88 | ✓ |
| `--tet` price text on tet bg / base bg | 5.37 / 5.46 | ✓ |
| `:focus-visible` ring from `--primary` — base 7.29 / 7.85 · tet 5.37 / 5.88 · trung-thu 10.2 / 11.5 | — | ✓ (≥3:1) |

**Caught during review (kept for the record):** this document's first draft proposed `--accent-deep: #97722a` for the seasonal themes — it fails as text on tet/thu bg (4.03 / 3.91) *and* as a cocoa-ink fill hover (3.57), regressing the current tet button hover (4.76). The error was copying the white-ink theme's "darker hover is safer" reasoning into a dark-ink theme. The §3.1 values above are the corrected, verified set.

Re-run this script whenever a token value changes (checked into the repo as `scripts/contrast.mjs` in the plan, §7 — at selector level per §3.3).

---

## 4. Typography and layout

### 4.1 Fonts and diacritics

- **Playfair Display** (display serif) + **Be Vietnam Pro** (body/UI) — **keep both.** Verified this session: Google Fonts serves dedicated `vietnamese` subsets for both (full Chrome UA required for the check). The BaseLayout comment (`BaseLayout.astro:30-33`) already documents this; I re-verified rather than trusting it.
- `Be Vietnam Pro` is not just diacritic-correct, it is *the* contemporary Vietnamese UI face — correct dấu rendering at small sizes is an authenticity mark (culture study: fake-brush "Asian" display fonts and dropped diacritics are the typography cliché; the wordmark stays **Nhà Mai** with full diacritics everywhere, including `<title>` and OG tags).
- Weight discipline: display 500–700, body 400–700, one italic use (`.signature`, `.testi blockquote`). No additional families; the expressive work belongs to size, not to more fonts.
- Load: keep the single css2 request + preconnects (`BaseLayout.astro:34-39`); subsets keep payload small. Do not self-host in v1 — one CSS request to a CDN is fine for a static site; revisit only if PageSpeed flags it.

### 4.2 Editorial vs grid decisions

| Surface | Decision | Research trace | Plan step |
|---|---|---|---|
| Hero | **One static type-led composition — the carousel is dropped.** Display headline at `--font-size-display`, one promise sentence, CTA row, reassurance tile in the right column. Rotating display headlines would cut against the very trends driving the change (type-led editorial + slow browsing both argue for one committed statement), and the second slide's doanh nghiệp message becomes a compact one-line band under the hero grid (copy + Zalo/phone CTAs from `Hero.astro:29-48`), not a rotating slide. The carousel markup, dots, `is-active` logic, and rotation script (`Hero.astro:50, 74-112`) are deleted. Photo/SVG panels become quieter: flat token-colored panels or art, never fake photography. | Trends: typography-led *rising*; slow browsing *rising*; anti-pattern: photo-style hero the shop can't fill. | 5 |
| Hero display fit | `--font-size-display: clamp(2.25rem, 6vw + 1rem, 5rem)` — cap raised 4.5rem → 5rem (72→80px) by the 2026-10-07 quiet-luxury type pass; floor and viewport rate are byte-identical, so the phone rendering is unchanged by construction: at 390px the formula still yields ≈39.4px in a ≈350px container → ~16–18 chars/line, 3–4 lines for the 41-char hero headline; at the 1140px container the ≈648px hero-main column sets that headline in ≈3 calm lines at the 80px cap. With the carousel gone there is no fixed aspect panel constraining the headline — `.hero-title` (`global.css:608`) sets `font-size: var(--font-size-display)`, so the token's 2.25rem clamp floor is the only floor (an earlier draft of this row cited `global.css:500`/`global.css:427` for a 1.6rem floor; both were dead pins inside `.header-hotline` — caught by the 2026-10-07 review sweep). If any headline exceeds 4 lines, the response depends on who owns the copy (**2026-10-07 amendment**): *authored* headlines (the hero — site copy) → shorten the copy, not the type; *data-sourced* headlines (the PDP h1 = owner product names, not editable site copy) → dial the type clamp back instead. Browser line-count check at 390px ran 2026-10-07 (hero ≈39.4px by construction; longest PDP h1 at its 32px floor, ≤3 lines) — re-run manually after any clamp change; no renderer in CI. | — | 5 |
| Scrim scope | The `--scrim` gradient (`global.css:397-408`) applies **only to panels with real imagery** (background-image/SVG art with overlay text). Flat token-colored panels use surface tokens and no scrim — a legibility scrim over a flat color is a leftover photo idiom. | Anti-pattern: photo idioms on non-photo surfaces. | 5 |
| Homepage rhythm | Keep the current section ladder (hero → occasions → categories → 8 featured → steps → commitments → story → *real-proof band, replacing testimonials* → contact, `pages/index.astro`) — it already paces slowly. Keep featured at **8 max** (`index.astro:18` already slices to 8). | Slow browsing: fewer, larger cards; small catalog is an advantage. | 5–6 |
| Hero grid | Keep the asymmetric `2fr / 1fr` split (`global.css:361-366`) — it is a restrained 2-tile bento; do **not** grow it into a 5–6 tile bento wall. | Bento is at *peak*/saturation warning; gift study calls bento an honorable-mention style choice, not a foundation. | 5 |
| Product grid | `auto-fill, minmax(245px→260px, 1fr)` — slightly larger cards, same gap `--space-5`. Catalog page keeps chip filtering (`ProductGrid.astro`), gains price-tier chips (§5.5). | Slow browsing + VN price-band convention. | 2 |
| Prose measure | Story/about body text capped at `--container-prose` (~70 chars). | Trends: ~70-char lines for readability. | 2 |
| Occasion strip | Keep as the second homepage band (`OccasionStrip.astro`); **cap at 8 chips** (it renders all 12 today, `OccasionStrip.astro:14-28`). Selection rule: the four all-year occasions (`Sinh nhật`, `Khai trương – tân gia`, `Cưới hỏi`, `Thăm bệnh` — `month: "Cả năm"` in `occasions.json`) plus the **next 3–4 occasions by calendar month**, using the `month` labels the data already carries (e.g. in October: 20/10, 20/11, Tết). This keeps every visitor one glance from "their" date without a wall of 12 chips. | Gift study: occasion-first nav, ~6–8 visible occasions with month labels. | 5 |

### 4.3 Typographic voice

Headlines speak in the shop's first-person family register that the copy already uses ("Mình tin quà biếu là lời nói thay mình" — `pages/index.astro:61`). Display type settings: `--leading-tight`, no all-caps for Vietnamese headlines (dấu stack badly in caps), `--tracking-caps` reserved for the Latin-free eyebrow/badge strings. Eyebrow color moves to `--accent-strong`.

---

## 5. Component treatment

### 5.1 Buttons (`.btn` — `global.css:158-204`)

- Variants stay: `--primary` (pine fill), `--accent` (**fill becomes `--accent-fill`**, hover `--accent-fill-hover`, ink `--accent-ink` — this is the AA fix, polarity-correct per theme per §3.1), `--ghost` (border on surface). Sizes: default, `--big`.
- States: rest → hover (`translateY(-1px)` + hover fill, `--dur-base`) → `:focus-visible` (3px `var(--primary)` ring per §3.3) → active (no extra style; the lift is enough) → disabled (submit in flight: `opacity .6; cursor: progress`).
- Motion: all transitions use `var(--dur-base) var(--ease-out)`; no pulse, no shine.

### 5.2 Cards (`.card` — `global.css:598-698`, `ProductCard.astro`)

- Anatomy (top→bottom): badge (only when true) → media (SVG placeholder, `aspect-ratio 4/3`) → category eyebrow → **name** → **subtitle/recipient** (promote `product.subtitle` — currently rendered nowhere on the card!) → description clamp-2 → contents line "Gồm 8 món" (new, from structured `contents`) → price → Zalo CTA.
- States: rest (border `--border`, `--shadow-soft`) → hover (`--border-strong`, `--shadow-lift`, `translateY(-3px)`) → `:focus-within` mirrors hover and reveals the Zalo CTA (exists `global.css:692-693` — keep, it is the keyboard path) → `(hover: none)` always shows the CTA (exists `global.css:696-698` — keep, it is the touch path).
- Stretched-link pattern stays (`.card-link::after`, `global.css:616-621`); the Zalo link stays `z-index: 2` above it.

### 5.3 Hero (`Hero.astro`, `global.css:360-505`)

- **One static type-led composition; the carousel is dropped** (decision and research trace in §4.2). The 2fr column becomes the display headline + promise + CTA row; the 1fr column stays the reassurance tile ("Gói đẹp miễn phí · Thiệp viết tay · Giao nhanh 2h" — already its content, `Hero.astro:53-62`), so principle 1.4 holds on first paint. Slide 2's doanh nghiệp message (`Hero.astro:29-48`) becomes a compact band under the hero grid. The carousel script, dots, and `is-active`/`data-carousel` machinery (`Hero.astro:50, 74-112`; `global.css:368-385, 434-454`) are deleted — removing the site's only `setInterval`.
- Scrim tokenized (`rgba(var(--scrim) / 0.62 → 0.05)`) and **scoped to imagery panels only** (§4.2); flat token-colored panels get no scrim.
- Reduced-motion: with the carousel gone there is no timed rotation left to guard. The rule stands for anything future: any reintroduced rotation must gate its timer on `matchMedia('(prefers-reduced-motion: reduce)')` — the global duration kill (`global.css:1081-1088`) zeroes transitions but does not stop a `setInterval`.

### 5.4 Forms (`ContactForm.astro`, `global.css:857-908`)

- Persistent labels stay (never placeholder-as-label); inputs on `--bg` inside `--surface` sheet (text 14.62:1 ✓); focus = primary border + 22% color-mix ring (exists `global.css:893-899`) — tokenize the ring as `--focus-ring-color`.
- Status messaging stays optimistic-honest (the endpoint honesty gate at `ContactForm.astro:91-131` is a feature — keep; wire `site.json.orderEndpoint` when the Apps Script URL exists, commit `b3df50f` already built the receiving side).
- One-page, guest-only, no added fields: name, phone, product, message + honeypot is the whole contract (trends: every extra field is abandonment; 48% unexpected costs / 22% complicated checkout). The only addition research supports: a one-line delivery promise above the submit, sourced **only from promises already shipped in `site.json` and site copy** — "Giao trong ngày tại {deliveryArea} · cần gấp thì giao nhanh 2h (nội thành) · hẹn giờ khi chốt đơn" (`site.json:14`, `Hero.astro:55`, `Commitments.astro:17`). It is copy, not a date-picker the webhook can't honor. A named cutoff hour ("đặt trước 14h") ships **only after the shop owner confirms one** — same honesty-gate discipline as `orderEndpoint` in the same form.

### 5.5 Chips & badges (`global.css:206-249`)

- `.chip` filter row gains **price tiers** as links alongside category chips on the catalog page — the domestic convention, one click to the right budget rung. Tiers: `dưới 500k` / `500k – 1tr` / `trên 1tr` (boundaries at 500,000 and 1,000,000 VND). Current catalog lands **4 / 10 / 2** products in those bands (node count this session; all bands populated), and the spread is 350k–1.45M. Implementation requires `data-price={product.price.amount}` on the card (`ProductCard.astro` — cards currently carry only `data-cat`/`data-tags`, `ProductCard.astro:17-18`, so the existing filter script cannot see price) before `ProductGrid.astro`'s URL-param filter can act on `?price=`.
- `.badge--hot` keeps `--tet`; the Tết lì-xì border-radius trick (`global.css:249`) is exactly the kind of L3 rule worth keeping — it is small, thematic, and token-driven.
- No badge motion, no countdown timers (fake-perpetual urgency is anti-pattern #6; the *real* urgency is Tết delivery cutoffs stated as copy).

### 5.6 Header / Footer

- Header: sticky + backdrop blur stays (`global.css:252-259`); theme switcher added per §2.4; mobile panel unchanged except it hosts the switcher.
- Footer gains the circular **brand seal** (§6) and the honest social-proof line: "7 năm · [phone] · mở cửa 7:30–20:30 cả tuần" — real numbers only.

### 5.7 Motion inventory (complete — nothing else gets animated)

| Interaction | Motion | Token |
|---|---|---|
| Button hover | −1px lift + hover fill | `--dur-base` |
| Card hover/focus | −3px lift + shadow step | `--dur-base` |
| Chip hover | border/color only | `--dur-fast` |
| Zalo CTA reveal | opacity + 4px rise | `--dur-fast` |
| Theme swap | token cascade (colors transition where `transition` is already declared) | `--dur-base` |

(With the carousel dropped there is no `--dur-slow` consumer left in the hero; keep the token for imagery crossfades on the PDP/occasion art.) All motion is killed by the existing `prefers-reduced-motion` block.

---

## 6. Motif and imagery direction

### 6.1 Motif system (ranked, one protagonist per surface)

1. **Hoa mai** — the brand's namesake (`site.json:2` "Nhà Mai" = *mai nha* home + *hoa mai*). Single-line botanical line-art in pine/terracotta on cream year-round; **full gold mai reserved for Tết** (`public/images/hoa-mai.svg` already exists as the watermark). One protagonist per surface — never a border of repeating blossoms plus three other symbols.
2. **Van may (monsoon-cloud scroll)** — quiet companion curve on thiệp and tissue (Marou's own motif; the classic Vietnamese decorative cloud).
3. **Stamp/seal language** — a circular brand seal, postmark-style, diacritics correct, stamped red or gold on kraft; doubles as the "hand-packed" authenticity mark next to the handwritten card (Vinamilk's print-ephemera sourcing: stamps, seals, hand-drawn labels).
4. **Mai-nha roofline** — a subtle house-gable line as section divider or box-lid cut; the name itself licenses "family home" without a single costume icon.
5. **Bronze-drum (Đông Sơn) geometry** — optional abstract edge/border pattern; ancient and geometric, zero tourist coding.

**Not used:** non-la silhouettes, cartoon dragons, bamboo-everywhere, lotus clip-art, illustrated ao-dai figures, lantern collages — "abstract or omit."

**Rules that keep them modern** (culture study, from the Marou/Hanoia/Kaikado evidence): one motif per surface; line-weight discipline; real negative space; hand-drawn imperfection over vector smoothness; tie every motif to product or place story; let symbols be discovered, never captioned ("mai = luck" labels are the tourist move — Marou hides the golden bat, it doesn't explain it).

### 6.2 Material register (site + packaging stay coherent)

Everyday = cream field + pine structure + one terracotta accent + kraft. Tết = crimson field or crimson-on-cream + antique gold + mai in gold — *same grid, same type, only the register shifts*, so the Tết variant reads as "Nhà Mai's Tết," not a generic red-gold box. Silk ribbon in pine/terracotta year-round beats a red bow. Gold is always matte ink or blind deboss, never shiny foil.

### 6.3 Placeholder → photo transition path

1. **Now (SVG era):** SVG art is honest illustration, not fake photography — alt text keeps the "Ảnh minh họa" prefix (`ProductCard.astro:24` already does this). Type carries the selling (§1.1); the contents manifest carries the value (§1.3).
2. **Testimonials — remove first, re-add when real (decision).** The shipped `Testimonials.astro` renders invented customers ("SAMPLE REVIEWS — placeholder testimonials (no real customers yet)" at `:4`; "Chị Hương/Anh Minh/Bạn Lan" at `:10-23`; a "5 trên 5 sao" star rating at `:39`). That violates principle 1.4 and the research's inflated-proof anti-pattern, so the section comes **off the homepage now** (plan step 6) and is replaced by a real-proof band using only facts the site already owns: `{yearsInBusiness} năm` (`site.json:15`), the real phone and hours (`site.json:6,11`), and the 30-minute reply promise (`site.json:13`). Go-live criterion for bringing testimonials back: real customer quotes (ideally Zalo/Facebook message screenshots, with permission) — "screenshots of messages are attainable imagery long before product photos" (gift study). No star ratings or review counts until there are real reviews to count.
3. **Drop-in swaps, no markup edits:** the hero already probes for `hero-tet-*.svg` and activates them on load (`BaseLayout.astro:68-75`) — extend the same convention: photos land at `/images/products/<slug>.jpg` and `ProductCard`/PDP prefer the jpg when it exists (a tiny build-time existence check in `utils/catalog.ts`), else fall back to the SVG.
4. **Never:** generic stock basket photos — the recipient sees the real basket; mismatch = broken trust (anti-pattern #3).

---

## 7. Implementation plan

Ordered, each step one small commit. Steps 1–4 are the foundation (tokens + themes); 5–10 build on them. Every step is scoped so the site stays shippable after it.

| # | Commit (suggested message) | Files | What |
|---|---|---|---|
| 1 | `fix(a11y): AA-safe accent tokens + selector-level contrast script` | `global.css`, `BaseLayout.astro` | Add `--accent-strong`/`--accent-fill`/`--accent-fill-hover`, change `--accent-deep` to `#8a4418` (§3.1); retarget `.eyebrow`, `.link-more`, `.card-zalo` → `--accent-strong`; `.btn--accent` → `--accent-fill`, `:hover` → `--accent-fill-hover`; `a:hover`, `.chip:hover` → `--accent-deep`; `:focus-visible` ring → `var(--primary)` (§3.3); add `color-scheme: light` + `<meta name="color-scheme" content="light">`. Add `scripts/contrast.mjs` auditing **selector-level pairs** (rest + hover, per theme, ring vs `--bg` and `--surface`) per §3.3/§3.4. |
| 2 | `feat(tokens): type/space/radius/motion token layer` | `global.css` | Add the §3.2 tokens to `:root`; migrate global.css's own hardcoded values (gaps, radii, durations) to them; product grid `minmax(245px → 260px)` and the `--container-prose` cap on story/about prose (§4.2). Components migrate opportunistically later — no big-bang rewrite. |
| 3 | `feat(theme): registry, precedence, trung-thu` | `BaseLayout.astro`, `global.css` | Rewrite the inline head script per §2.7: whitelist `['base','tet','trung-thu']`, try/catch `localStorage['nm:theme']`, seasonal map (11/12/1/2→tet, 9→trung-thu), **always** set one attribute, set `data-theme-ui="on"`, gate motif/hero side-effects on `effective === 'tet'`. Finish the `[data-theme='trung-thu']` block with the verified §3.1 values. |
| 4 | `feat(theme): switcher in header` | `Header.astro`, `global.css` | Segmented control (Auto/Tết/Trung Thu) per §2.4: desktop slot between `.site-nav` and `.header-hotline`; mobile inside the nav panel; `aria-pressed` from the live attribute; writes/removes `nm:theme` **then `location.reload()`** (L4 runtime tokens are load-time — §2.4); hidden without `data-theme-ui`. |
| 5 | `feat(hero): static type-led hero` | `Hero.astro`, `pages/index.astro`, `global.css` | §4.2/§5.3: one static composition at `--font-size-display` (carousel, dots, rotation script deleted; slide-2 doanh nghiệp copy → compact band under the hero grid); `--scrim` scoped to imagery panels only; browser line-count check of the display headline at 390px (arithmetic estimate in §4.2, renderer check not yet run); occasion strip capped at 8 via the all-year + next-3-by-month rule (§4.2). |
| 6 | `fix(content): replace placeholder testimonials with real proof` | `pages/index.astro`, `Testimonials.astro`, `global.css` | §1.4/§6.3 decision: remove the invented-customer section (`Testimonials.astro:4-25`, stars `:39`) from the homepage; replace with a real-proof band rendered only from `site.json` facts (7 năm, phone, hours, reply-within). Real quotes return only per the §6.3 go-live criterion. Scoped deliberately smaller than step 9. |
| 7 | `feat(cards): subtitle + contents manifest` | `products.json`, `ProductCard.astro`, `products/[slug].astro` | Render `product.subtitle` on cards; add optional `contents: string[]` to products (source: existing descriptions) and render "Gồm N món" on card + itemized list on PDP (`.meta-list` already exists for this). |
| 8 | `feat(catalog): price-tier chips` | `products/index.astro`, `ProductGrid.astro`, `ProductCard.astro` | Add `data-price={product.price.amount}` to the card (cards currently carry only `data-cat`/`data-tags` — `ProductCard.astro:17-18` — so price filtering is impossible without it); tier chips `dưới 500k / 500k – 1tr / trên 1tr` (boundaries 500k/1M; current catalog: 4/10/2) as `?price=` links, extending the existing URL-param filter script (`ProductGrid.astro:43-83`). |
| 9 | `feat(motif): brand seal + roofline divider` | `public/images/`, `Footer.astro`, `global.css` | Circular seal SVG (stamp language), gable-line section divider; footer honest-proof line (subsumes the step-6 band if both land together). |
| 10 | `chore(verif): PR checks` | `.github/workflows/check.yml` (new) | New `pull_request` workflow: checkout → setup-node (≥22.12, matching the deploy workflow's Astro requirement, `deploy.yml:24`) → `npm ci` → `node scripts/contrast.mjs` → `npm run build`. The existing `deploy.yml` stays untouched: it runs `withastro/action@v6` (`deploy.yml:20`), which does install+build+upload in one step and cannot run a custom script — and it triggers on `push` only (`deploy.yml:3-5`). |

**Verification for every step:** `npm run build` (21 pages today) + `scripts/contrast.mjs` green + manual no-JS check (JS disabled → base theme, no switcher visible) + `?theme=tet` manual-pick-in-offseason spot check once step 3 lands + at step 5, a browser check of the display headline's line count at 390px (§4.2).

---

## 8. Mobile thumb-zone pass (2026-10-06)

The site shipped desktop-first; this section records the mobile pass built on top of §1–§7 without reopening any of their decisions. Containment rule: every rule here lives inside `@media (max-width: 900px / 700px / 560px / 330px)` or `(hover: none)` blocks. The only all-width changes are `html { scroll-padding-top: 4.5rem }` and the 16px form-control font — both strict improvements. No new tokens (the 56-token contract holds); every new surface rides an already-audited §3.4 pair.

### 8.1 Bottom quick-access bar (`src/components/BottomBar.astro`)

- Mobile-only fixed bar, `display: none` above 900px: 56px tall + `env(safe-area-inset-bottom, 0px)` padding, `--surface` fill, 1px `--border` top edge, `z-index: 40` — under the header's 50, so an open nav panel overlays it. `body` reserves `calc(56px + env(safe-area-inset-bottom, 0px))` at ≤900px so the footer's last row is never covered. The viewport meta carries `viewport-fit=cover` so the inset resolves.
- Five equal slots, each ≥48×48 (24px icon + ~11.5px semibold label): **Trang chủ** · **Giỏ quà** · **Zalo** · **Gọi** · **Đặt quà** (→ `/contact/#dat-qua` — the enquiry form's anchor, which `scroll-padding-top` now lands below the sticky header).
- Stated HIG deviation: Zalo and Gọi are *actions styled as actions*, not tabs — Zalo is a raised pill on the `.btn--primary` pair (`--primary` fill, `--primary-ink` label, hover `--primary-deep`), Gọi is the `.btn--ghost` pair (`--border-strong` border, `--primary` icon+label on `--surface`); neither ever takes an active state or tab semantics. HIG's cited rules are honored: labels always visible, the bar never hides, three destinations (inside the 3–5 range).
- A small bundled script (no attributes — Astro-processed) marks the current *destination* with `aria-current="page"` by comparing `location.pathname` to each link's `asset()`-prefixed href → `--primary` label + a 3px `--primary` top indicator (inset box-shadow, no layout shift). The same script injects `<meta name="theme-color">` from the computed `--bg` so mobile chrome follows base cream / Tết / Trung-thu — runtime DOM injection, never a `<head>` markup edit (the head is pinned by check-docs).
- Contrast: the bar adds zero new pairs — `--primary-ink` on `--primary`/`--primary-deep` (audited button pair), `--primary`/`--muted` on `--surface`. The Zalo pill's focus ring uses the §3.3 dark-panel ink exception (`--primary-ink` on a `--primary` fill) since a `--primary` ring there is 1.00:1.

### 8.2 Mobile header (`src/components/Header.astro`)

- `.header-hotline` renders at ≤900px as a compact `tel:` row between brand and hamburger: phone glyph + `--primary` tabular-nums number, min-height 44px; the "Hotline · hours" subline stays desktop-only. Narrow tiers (≤560px hides the brand subline and tightens the gap; ≤330px drops the glyph but keeps the number) keep brand + number + 48px hamburger on one line down to 320px.
- `.nav-toggle` grows to min 48×48 (1.25rem glyph); open-panel nav links are full-width min-height 44px rows; `.theme-switch-btn` and the panel's Zalo button grow to min-height 44px.
- The panel closes on Escape and on any document-level tap outside `.site-header`, besides the existing nav-link path — all paths sync `aria-expanded="false"`.
- `.site-header` gained a plain `var(--bg)` declaration *before* the `color-mix()` line (older WebViews dropped `color-mix()` and rendered a transparent sticky bar) and `-webkit-backdrop-filter` alongside `backdrop-filter`.

### 8.3 Catalog browsing on phones

- ≤560px: the chip filter rows (occasion, category chips, price tiers — the occasion row joined 2026-10-07, see §9) stop wrapping — each becomes one horizontal snap-scroll row (`overflow-x: auto`, `scroll-snap-type: x proximity`, `-webkit-overflow-scrolling: touch`, chips min-height 44px, `flex: 0 0 auto`), so the first product card renders near the fold instead of after 4–5 wrapped chip lines.
- ≤700px: `.occ-grid` becomes one horizontal snap row of fixed-min-width (180px) chips. All 12 chips stay server-rendered and the client-side `[hidden]` cap keeps working — the global `[hidden] { display: none !important }` rule still wins over the flex row. Pure CSS overflow; no carousel machinery (check-output bans `data-carousel`/`hero-dot`).
- ≤560px: cards slim vertically — `.card-desc` hides (the PDP carries the full description), `.card-body` padding/gap tighten, `.card-foot` may wrap. The grid keeps `minmax(260px, 1fr)` — the §4.2 slow-browsing floor is deliberately NOT shrunk; density is bought back vertically, not by gridding 2-up.
- `.card-zalo` is a real target on `(hover: none)` devices: bordered pill (border `--border-strong`, text `--accent-strong` — the audited card-surface accent pair), min-height 44px, still `z-index: 2` above the stretched `.card-link::after` so a thumb mis-tap can't silently open the PDP instead of chat.
- `.breadcrumb a` (≤900px, `display: inline-block` + `padding-block: 0.55rem`) and `.site-footer li` (≤900px, min-height 44px) clear the 44px tap floor.

### 8.4 Contact-flow plumbing

- `html { scroll-padding-top: 4.5rem }` — `#dat-qua`, `#lien-he`, `#dip-tang-qua`, `#gio-noi-bat` land below the ~60px sticky header (with `scroll-behavior: smooth` this is what makes the bar's one-tap shortcuts reveal their target).
- A "Nhảy tới nội dung" skip link is the first focusable element in `<body>`: off-screen until `:focus-visible`, then a `--primary`-filled bar top-left with the ink focus ring (§3.3), jumping to the existing `<main id="main">`.
- Form controls rise to 16px (`--font-size-base`) — iOS Safari stops auto-zooming on focus. The honesty-gate/no-cors lines in ContactForm are untouched.
- The floating Zalo pill retires at ≤900px (the bar's Zalo pill replaces it; its fixed corner also covered the footer's last links and the form submit area at scroll end) and its z-index drops 60 → 45, below the header's 50, so it can never overlay an open nav panel even on desktop-width resize. ≥901px it renders exactly as before — the BaseLayout markup is untouched, so every check-docs citation pin survives by design.

Verification for this pass: the four gates (`npm run build` → `npm run check:contrast` → `npm run check:output` → `npm run check:docs`) plus a manual sweep of the new pairs (base / tet / trung-thu) against the §3.4 table — the new selectors ride only pairs already in it.

---

## 9. Occasion filter row, quiet-luxury type pass, PDP story facts (2026-10-07)

Built on §1–§8; no earlier decision reopened. The §3.2 clamp values/comment, the §4.2 display-fit amendment, and the §8.3 "chip filter rows" reword above are this pass's doc-truth edits. Record:

- **Occasion filter on /products/ (the Dịp tặng row).** A third chip filter row (`role="group"` / `aria-label="Lọc theo dịp tặng quà"`), placed ABOVE the Nhóm (category) row because a gift shopper decides dịp before nhóm — §1.3's occasion-first pattern carried into the catalog itself. All 12 `occasions.json` entries are server-rendered with NO client cap: this is a filter, not the capped marketing band (the homepage OccasionStrip keeps §4.2's 8-chip cap), hiding e.g. Trung Thu in October would hide a working filter, and no-JS visitors must see every option. Chips reuse `.chip` (never `.occ-chip` — check-output counts that class on the homepage) and inherit the §8.3 ≤560px snap-row behavior. URL behavior extends the existing `?tag=` param: a deep link (homepage strip or PDP story row) now lands on a lit chip with one-tap clear; setting a tag deletes `?category=` from the URL AND resets the category state in the same stroke (the cat handler's discipline — URL-only edits desync state vs reload); load precedence stays `?category=` wins over `?tag=`. The four audience/merit tags in products.json (`ban-chay`, `bieu-sep`, `gia-dinh`, `doanh-nghiep`) are deliberately NOT promoted to occasions — the cap above, and the recipient dimension is served per-product by the story-facts block below. No new routes (`?tag=` is a filter param, not a page — the sitemap gate pins the route set).
- **Quiet-luxury type pass.** Value-only token edits (the 56-token count holds): `--font-size-display` cap 4.5rem → 5rem with floor/rate byte-identical (390px rendering unchanged at ≈39.4px), `--font-size-2xl` → clamp(2rem, 4.75vw, 3.125rem) (h1 inner pages incl. PDP names), `--font-size-xl` → clamp(1.6rem, 3.4vw, 2.35rem) (h2); new `text-wrap: balance` on h1/h2/.hero-title; `.section`/`.section-head` airier clamps; the PDP price renders in `--font-display` (card prices stay sans + tabular-nums — scanning; Playfair has no tabular figures). Bigger, calmer serif headlines over the quiet sans body IS the quiet-luxury move (§1.1 type-led editorial) — no new fonts, weights, or origins (the CSP meta is never-touch), no new `:root` properties.
- **PDP story facts.** The "Gồm N món trong giỏ" h3+ul becomes a semantic `<dl class="story-facts">` between the description and the options block: **Tặng ai** ← `product.subtitle` · **Dịp nào** ← product tags ∩ occasions (each name links to `/products/?tag=` — the loop closes with the filter row above) · **Bên trong giỏ** ← contents joined " · ". The standalone muted subtitle `<p>` that used to sit under the h1 was removed in review: the first pass kept both and rendered `product.subtitle` twice on every PDP — it now renders exactly once, as the labeled Tặng ai row (the label is what makes the repeat worth keeping over a bare tagline). Every row guards itself against owner-edited data (hide the row if empty; hide the whole dl if all three empty); zero schema edits — §1.3's contents manifest and §5.2's subtitle get their PDP surface. Labels deliberately NOT uppercase (§4.3 — Vietnamese diacritics stack badly in caps); colors ride only audited §3.4 pairs (--text/--muted/--primary links on --surface).

---

### Source studies

This document synthesizes four research inputs supplied with the ask (trends, gift-patterns, switcher mechanics, culture), each with their own cited sources, plus direct reads of this repository listed in the preamble. Code citations reference `path:line` as read this session; checks are listed with exact commands and outputs at the top. Claims I could not verify myself are attributed to their study rather than stated as fact.
