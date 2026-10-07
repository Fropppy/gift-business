# Owner updates guide

Step-by-step guide for Khanh to update product details and the placeholder
contact data himself — no agent needed. The owner-only items come from the
SEO proposal at the repo root (2026-10-07; items P1-1, P1-3, P2-1…P2-4);
the code-side items of that proposal are not repeated here.

Everything in this guide is data files (`src/data/*.json`) and image files
(`public/images/`). It deliberately does NOT touch `orderEndpoint` —
deploying the order webhook is its own
[go-live checklist](operations.md#go-live-checklist-pending). The
placeholder contact data is intentionally LIVE on the public site until you
replace it (AGENTS.md "Non-obvious facts") — nothing below fixes a bug; it
swaps samples for real facts. The roadmap tracks this as pending owner
action ([roadmap.md](roadmap.md#now)).

## Before you start

1. Node >= 22.12 (never 23), `npm install` once.
2. `npm run dev` → http://localhost:4321/gift-business/ — the site
   hot-reloads when you save edits to the data JSON.
3. Golden rule for JSON edits: change VALUES, never structure. Keep one key
   per line, same order, same quotes. The docs gate pins facts to line
   numbers — e.g. `src/data/site.json` line 16 must stay the
   `orderEndpoint` line and lines 6-10 must keep the contact keys — so a
   values-only edit passes every check while a re-format can fail them.

## What only you can do

These need the owner's eyes, hands, or accounts. An agent cannot do any of
them.

### 1. Real phone, Zalo, Facebook in site.json (NAP consistency)

Edit the five fields at `src/data/site.json` lines 6-10 together — they
must agree with each other:

```json
"phoneDisplay": "0901 234 567",
"phoneHref": "tel:+84901234567",
"zaloUrl": "https://zalo.me/84901234567",
"facebookUrl": "https://www.facebook.com/<your-page>",
"messengerUrl": "https://m.me/<your-page>",
```

- `phoneDisplay`: the human form, as you say it aloud.
- `phoneHref`: `tel:+84` + the number without its leading 0, no spaces.
- `zaloUrl`: `https://zalo.me/84` + the same digits as `phoneHref`.
- `facebookUrl` / `messengerUrl`: the same page username in both.
- **NAP rule:** whatever you write must match your Google Business Profile
  (step 5) character-for-character. Every page already publishes these
  values as machine-readable LocalBusiness structured data
  (`src/layouts/BaseLayout.astro:33-43`), so today the placeholder
  `0900 123 456` is being asserted to Google as fact — replacing it is not
  cosmetic.

### 2. Street address — only if you are willing

No street address exists anywhere on the site today (`site.json` has no
address field). Staying delivery-only is honest and fine. If you do want
one published: it must match the GBP character-for-character, and adding
it is NOT a `site.json`-only edit — the contact page and the
LocalBusiness schema need a small template change. Give the address to an
agent and point them at proposal item P1-3.

### 3. One og:image (1200×630 raster) for link previews

Zalo and Facebook are the order channels, and every shared link today
renders with NO preview image — `public/images/` holds only SVGs, which
social crawlers will not render (the gap is marked in source at
`src/layouts/BaseLayout.astro:84-89`). Produce one ~1200×630 PNG or JPEG —
it can be composed from the existing brand SVGs (`seal.svg`,
`hoa-mai.svg`) exported to PNG — and drop it into `public/images/` (e.g.
`og-default.jpg`). Wiring the `og:image` + `twitter:card` meta is then a
one-spot code change marked by that TODO: hand the file to an agent.
(Proposal P1-1.)

### 4. Real product photos (800×600)

One photo per product, **800×600 px (4:3)** — that matches the
width/height every product `<img>` already declares, so nothing shifts
layout. Name each file exactly `<slug>.jpg` (same basename as today's
placeholder `<slug>.svg`) and place it in `public/images/products/`. Then
in `src/data/products.json` point BOTH `images[]` and `thumbnail` at the
`.jpg` path: `productImage()` resolves thumbnail → images[0] → the shared
placeholder (`src/utils/catalog.ts:71-74`), so the site switches only when
the JSON points at the new file — dropping the photo in alone does
nothing. Keep each file modest (~under 300 KB) for mobile data. The exact
16 filenames are pre-filled in the worksheet below. (Proposal P2-1;
per-product share images can follow from the same shoot.)

Hero art works the same way but self-switching: replace
`hero-1/2/tile.svg` with photos of real baskets (same basenames), and
during Tết season (Nov–Feb) `hero-tet-1/2/tile.svg` activate by themselves
the moment those files exist — no JSON, no code
(`src/layouts/BaseLayout.astro:159-166`).

### 5. Google Business Profile — register + verify (free)

A github.io catalog page can never appear in the "giỏ quà gần đây" Maps
pack on its own; a verified GBP puts Nhà Mai there with a tap-to-call
button. At business.google.com, register "Nhà Mai" with:

- **Category:** gift shop (Cửa hàng quà tặng).
- **Hours:** the same hours `site.json` line 11 states
  (7:30 – 20:30, every day).
- **Hotline:** the real phone from step 1 — identical digits everywhere.
- **Service area:** TP. HCM and vicinity (`site.json` line 14).
- **Website:** https://fropppy.github.io/gift-business/

Then make it a flywheel: after each completed Zalo order, send the
customer your GBP review link, and reply to reviews in the shop's own
voice. Real reviews on the GBP are the honest version of social proof —
the site deliberately carries none. (Proposal P2-2.)

### 6. Optional: Zalo Official Account (paid)

Repoint `zaloUrl` at a Zalo OA for an official chat-based ordering
channel. Research in the proposal put pricing at ~1.000.000₫/year but that
was **unverified** — confirm current pricing/tiers at zalo.me before
deciding. (Proposal P2-3; a conversion lever more than an SEO one.)

One more free owner action worth doing early (proposal P2-4): verify a
Google Search Console property for the site and submit `sitemap.xml`
manually — while the site lives on a github.io subpath, that is the only
reliable discovery and measurement path.

## Product field rules

One file — `src/data/products.json` — drives everything about the 16
products. Rules per field, before you fill in the worksheet:

| Field | Rule | Why / where it lands |
| --- | --- | --- |
| `slug` | Never change it. | It IS the page URL (`/products/<slug>/`) and a sitemap row (`scripts/generate-sitemap.mjs` builds the URL list from it). A changed slug silently moves the page and 404s the old URL. |
| `name` | Keep the buyer's search words in it — "Giỏ quà Tết…", "Giỏ trái cây…", "quà biếu sếp". ≤ ~60 chars. | It becomes the page title, the `h1`, the image alt text, and the Product JSON-LD name. |
| `subtitle` | One short positioning line. | Shows under the `h1` and on cards; also leads the meta description (`src/pages/products/[slug].astro:30-31`). |
| `description` | UNIQUE across all 16, ~120–160 characters, your shop voice. | Card text, product-page body copy, and the JSON-LD description Google reads. Duplicate boilerplate across products wastes all three. |
| `contents[]` | List exactly what is really in the basket. | Renders as "Gồm N món trong giỏ". |
| `price.amount` | Integer VND only: `850000`, never `850.000` or `850.000₫`. `currency_code` stays `"vnd"`. | `formatVnd()` renders 850000 → 850.000₫ (`src/utils/catalog.ts:66-68`); the JSON-LD Offer also needs the raw number. |
| `inStock` | `true` / `false`. | Flips the JSON-LD Offer availability InStock/OutOfStock (`src/pages/products/[slug].astro:51`). |
| `images[]` + `thumbnail` | Point BOTH at `/images/products/<slug>.jpg`. | `productImage()` resolves thumbnail → images[0] → placeholder (`src/utils/catalog.ts:71-74`). |
| (alt text) | Not a JSON field — it is auto-derived as `Ảnh minh họa: <name>` on the detail page and every card (`src/pages/products/[slug].astro:90`, `src/components/ProductCard.astro:25`). | A descriptive name IS the alt text; write names that describe the actual basket. |

## The 16-product worksheet

Fill in the "real" columns (print or copy this table), then apply them to
`src/data/products.json` in one sitting — or hand the filled table to an
agent. Placeholder values are copied verbatim from the current file.

### Identity, price, photo

| # | slug (don't change) | Name — placeholder | Name — real | Price — placeholder | Price — real (integer VND) | Real photo file (800×600) |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `gio-trai-cay-nhap-khau-cao-cap` | Giỏ trái cây nhập khẩu cao cấp | | 850.000₫ | | `gio-trai-cay-nhap-khau-cao-cap.jpg` |
| 2 | `gio-trai-cay-sach-viet-nam-cho-gia-dinh` | Giỏ trái cây sạch Việt Nam cho gia đình | | 450.000₫ | | `gio-trai-cay-sach-viet-nam-cho-gia-dinh.jpg` |
| 3 | `gio-trai-cay-tham-benh` | Giỏ trái cây thăm bệnh – chúc mau khỏe | | 480.000₫ | | `gio-trai-cay-tham-benh.jpg` |
| 4 | `gio-qua-tet-vua-tui-tien` | Giỏ quà Tết vừa túi tiền | | 350.000₫ | | `gio-qua-tet-vua-tui-tien.jpg` |
| 5 | `gio-qua-tet-an-loc` | Giỏ quà Tết An Lộc | | 650.000₫ | | `gio-qua-tet-an-loc.jpg` |
| 6 | `gio-qua-tet-cao-cap-phuc-loc-tho` | Giỏ quà Tết cao cấp Phúc Lộc Thọ | | 1.450.000₫ | | `gio-qua-tet-cao-cap-phuc-loc-tho.jpg` |
| 7 | `gio-qua-doanh-nghiep-bieu-doi-tac` | Giỏ quà doanh nghiệp biếu đối tác | | 950.000₫ | | `gio-qua-doanh-nghiep-bieu-doi-tac.jpg` |
| 8 | `set-hop-qua-tet-cho-nhan-vien` | Set hộp quà Tết cho nhân viên | | 350.000₫ | | `set-hop-qua-tet-cho-nhan-vien.jpg` |
| 9 | `gio-qua-sinh-nhat-kem-gau-bong` | Giỏ quà sinh nhật kèm gấu bông | | 650.000₫ | | `gio-qua-sinh-nhat-kem-gau-bong.jpg` |
| 10 | `set-qua-sinh-nhat-hoa-socola-bong-bay` | Set quà sinh nhật hoa + socola + bóng bay | | 850.000₫ | | `set-qua-sinh-nhat-hoa-socola-bong-bay.jpg` |
| 11 | `gio-qua-tri-an-8-3-20-10` | Giỏ quà tri ân 20/10 – 8/3 | | 590.000₫ | | `gio-qua-tri-an-8-3-20-10.jpg` |
| 12 | `hop-qua-bieu-sep-yen-sao-tra-hao-hang` | Hộp quà biếu sếp – yến sào và trà hảo hạng | | 1.150.000₫ | | `hop-qua-bieu-sep-yen-sao-tra-hao-hang.jpg` |
| 13 | `hop-qua-suc-khoe-cho-bo-me` | Hộp quà sức khỏe cho bố mẹ | | 750.000₫ | | `hop-qua-suc-khoe-cho-bo-me.jpg` |
| 14 | `gio-qua-khai-truong-tai-loc` | Giỏ quà khai trương tài lộc | | 950.000₫ | | `gio-qua-khai-truong-tai-loc.jpg` |
| 15 | `set-qua-tan-gia-sum-vay` | Set quà tân gia sum vầy | | 550.000₫ | | `set-qua-tan-gia-sum-vay.jpg` |
| 16 | `set-qua-trung-thu-sang-trong` | Set quà Trung Thu sang trọng | | 890.000₫ | | `set-qua-trung-thu-sang-trong.jpg` |

### Descriptions

| slug | Description — placeholder | Description — real (unique, ~120–160 chars) |
| --- | --- | --- |
| `gio-trai-cay-nhap-khau-cao-cap` | Nho Mỹ, cherry, việt quất, kiwi xanh… tuyển quả tươi, gói mica màu đỏ sang trọng, hợp biếu sếp và đối tác. | |
| `gio-trai-cay-sach-viet-nam-cho-gia-dinh` | Ổi ruột đỏ, vú sữa, hồng giòn, xoài cát, táo… quà biếu gia đình vừa đẹp vừa thực. | |
| `gio-trai-cay-tham-benh` | Táo xanh, nho, ổi, thanh long, cam… chọn quả lành, dễ ăn cho người bệnh và người lớn tuổi. | |
| `gio-qua-tet-vua-tui-tien` | Bánh quy, kẹo, trà gói, hạt điều… gói đẹp, phù hợp biếu đồng nghiệp và bạn bè. | |
| `gio-qua-tet-an-loc` | Rượu vang, bánh quy ngoại, trà hảo hạng, hạt dinh dưỡng, nho khô… bộ quà biếu bố mẹ và họ hàng trong Tết. | |
| `gio-qua-tet-cao-cap-phuc-loc-tho` | Yến sợi, nhân sâm, rượu vang nhập, trà cao cấp… giỏ quà Tết sang trọng dành biếu cấp trên và đối tác lớn. | |
| `gio-qua-doanh-nghiep-bieu-doi-tac` | Vang, trà, hạt dinh dưỡng, bánh ngoại đóng giỏ cao cấp; đặt từ 10 giỏ gắn logo và thiệp chúc theo yêu cầu. | |
| `set-hop-qua-tet-cho-nhan-vien` | Bánh kẹo, trà, khăn ấm… đóng hộp đồng bộ; đặt từ 20 set có giá tốt kèm in logo doanh nghiệp. | |
| `gio-qua-sinh-nhat-kem-gau-bong` | Bánh kem nhỏ, trái cây nhập, hoa hồng, gấu bông và thiệp viết tay theo yêu cầu. | |
| `set-qua-sinh-nhat-hoa-socola-bong-bay` | Bó hoa hồng, socola nhập khẩu, kèm bộ bóng bay chữ Happy Birthday và thiệp. | |
| `gio-qua-tri-an-8-3-20-10` | Hoa tươi, trà hoa, socola và hạt dinh dưỡng đóng giỏ nhỏ xinh dành tặng mẹ, vợ, cô giáo, đồng nghiệp nữ. | |
| `hop-qua-bieu-sep-yen-sao-tra-hao-hang` | Yến sào chưng sẵn, trà Tân Cương, hạt dinh dưỡng nhập, rượu vang… đóng hộp sang trọng kèm túi giấy. | |
| `hop-qua-suc-khoe-cho-bo-me` | Hạt dinh dưỡng nhiều loại, táo đỏ, đông trùng, nho khô… món quà thiết thực về sức khỏe, hợp biếu bố mẹ và ông bà. | |
| `gio-qua-khai-truong-tai-loc` | Rượu vang, trà, bánh kèm bình hoa khai trương, chúc thăng hoa, phát tài phát lộc. | |
| `set-qua-tan-gia-sum-vay` | Trà, hoa khô, nến thơm và rượu vang nhỏ… món quà ấm cúng cho nhà mới. | |
| `set-qua-trung-thu-sang-trong` | Bộ bánh trung cao cấp 4–6 hộp kèm trà và rượu vang, đóng giỏ biếu khách hàng và đối tác dịp Trung Thu. | |

## Where each edit takes effect

| You edit | What changes on the site |
| --- | --- |
| `site.json` lines 6-10 (phone/Zalo/Facebook/Messenger) | Header hotline + Zalo button, floating Zalo button, footer contact column, contact-page channel cards, hero/CTA buttons, every product page's order buttons, the form's Zalo/hotline fallback (`src/components/ContactForm.astro:86-87`) — and the LocalBusiness JSON-LD `telephone`/`sameAs` machine-asserted on every page (`src/layouts/BaseLayout.astro:39,42`). |
| `site.json` lines 11-14 (hours, replyWithin, deliveryArea) | Contact page, footer, home/about copy, form notes, product-page delivery line — and LocalBusiness `openingHours`/`areaServed`. Caution: the schema's opening-hours string is currently hardcoded `"Mo-Su 07:30-20:30"` (`src/layouts/BaseLayout.astro:40`) — if your real hours differ, ask an agent to derive it from `site.json` in the same change. |
| `site.json` line 4 (description) | Default meta description + `og:description` on pages that don't override it, and the LocalBusiness description. |
| `products.json` (name, subtitle, description, price, …) | That product's whole page — title, `h1`, meta description, price line, body copy, Product + Offer + Breadcrumb JSON-LD — plus its card on `/products/` and the home featured grid. |
| `products.json` `slug` | The page URL and its sitemap row — don't change (see field rules). |
| `public/images/products/<slug>.jpg` + `images[]`/`thumbnail` | Product-page hero image, its card image, and the JSON-LD `image`. |
| `public/images/hero-*.svg` (and `hero-tet-*.svg`) | Home hero collages; the Tết variants self-activate in season. |
| `public/images/og-default.jpg` (to come) | Zalo/Facebook link previews once the og:image meta is wired (step 3 above). |

## Preview and verify

Preview while editing: `npm run dev` → http://localhost:4321/gift-business/
— check the product page you changed, its card on `/products/`, and the
footer after a `site.json` edit.

Before calling anything done, run all four gates, in this order
(AGENTS.md "Gates"):

1. `npm run build` — builds dist/ and regenerates `sitemap.xml` from
   `products.json`.
2. `npm run check:contrast` — WCAG color pairs per theme.
3. `npm run check:output` — runs AFTER build; asserts the built pages,
   including that `sitemap.xml` carries exactly the URL set your
   `products.json` implies.
4. `npm run check:docs` — links, index, and citation anchors.

If all four pass: commit on develop with a Conventional Commit subject,
e.g. `feat(frontend): swap placeholder products for real data`. Nothing
pushes anywhere without your review — and the PR into main re-runs all
four gates as the required `check` CI context.

Related: [operations.md → Replacing placeholder content](operations.md#replacing-placeholder-content)
keeps the shorter all-audiences placeholder table;
[architecture.md → Site](architecture.md#site) explains the data layer.
