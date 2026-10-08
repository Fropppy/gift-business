# Nhà Mai — giỏ quà nhà mình

Website catalog cho shop quà gia đình, xây bằng [Astro](https://astro.build) và
triển khai lên GitHub Pages tại `https://<username>.github.io/gift-business/`.

## Chạy local

```bash
npm install
npm run dev        # http://localhost:4321/gift-business/
npm run build      # xuất dist/
```

## Deploy lên GitHub Pages (làm 1 lần)

1. Push repo lên nhánh `main` của repo tên **`gift-business`**.
2. `astro.config.mjs` đã đặt `site: 'https://fropppy.github.io'` (lấy từ tài
   khoản GitHub đang đăng nhập trên máy) — kiểm tra lại đúng chủ sở hữu repo
   trước khi push lần đầu, và giữ nguyên `base: '/gift-business'`.
3. Repository **Settings → Pages → Build and deployment → Source = "GitHub Actions"**.
4. `package-lock.json` đã được commit — `withastro/action` tự nhận biết npm
   từ lockfile, không cần cấu hình thêm.
5. Push — workflow `.github/workflows/deploy.yml` tự build và deploy.

## Danh sách "thay là chạy được" (placeholder cần đổi trước khi đi thật)

| Vị trí | Cần thay |
| --- | --- |
| `src/data/site.json` | `phoneDisplay`/`phoneHref`, `zaloUrl`, `facebookUrl`, `messengerUrl` (dòng 6-10) đang là số/link mẫu; kiểm tra luôn `hours`, `deliveryArea`, `replyWithin`. `orderEndpoint` (Apps Script /exec URL) là bước go-live — xem docs/operations.md |
| `public/images/products/*.svg` | 17 ảnh SVG minh họa → ảnh thật cùng tên `.jpg/.avif`, cập nhật `images[]` trong `products.json` |
| `public/images/hero-*.svg` | Ảnh hero `hero-1/2/tile.svg` → ảnh giỏ thật, cùng tên. Mùa Tết (T11–T2): chỉ cần drop thêm `hero-tet-1.svg`, `hero-tet-2.svg`, `hero-tet-tile.svg` — hero Tết tự kích hoạt, không phải sửa code |
| `astro.config.mjs` | Không cần đổi — `site: 'https://fropppy.github.io'` (dòng 14) đã đúng cho repo này; chỉ đổi khi dời repo |

Sau này muốn tạo lại ảnh minh họa: `npm run generate:placeholders`.

## Kiến trúc nhanh

- **Token thiết kế** nằm hết trong `src/styles/global.css` (`:root`). Chủ đề Tết
  chỉ override token qua `[data-theme='tet']` — script trong
  `src/layouts/BaseLayout.astro` tự bật Tết từ tháng 11 đến tháng 2 (dương lịch).
- **Catalog**: `src/data/products.json` bám field model của Medusa
  (`slug→handle`, `name→title`, `price` là record Pricing Module
  `{amount, currency_code}`) để sau này import sang Medusa không phải thiết kế lại data.
- **Ảnh**: toàn bộ là SVG palette trong `public/images/` — mọi URL public đều đi
  qua helper `asset()` (`src/utils/asset.ts`) để thêm tiền tố `/gift-business`.
- **Form đặt quà**: tĩnh, gửi `POST` tới Apps Script (xem TODO trong
  `ContactForm.astro`); kênh chính của shop là nút Zalo/hotline đặt khắp trang.

## Tài liệu & quy trình

- Tài liệu đầy đủ — kiến trúc, quyết định thiết kế, vận hành, roadmap: [docs/README.md](docs/README.md)
- Làm việc cùng AI trong repo này: đọc [ZCODE.md](ZCODE.md) trước (tự động qua AGENTS.md).
