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
| `astro.config.mjs` | `site: 'https://khanh.github.io'` → username thật |
| `src/data/site.json` | Số hotline, link Zalo/Facebook/Messenger, giờ mở cửa, khu vực giao (đang là số/link mẫu) |
| `src/components/ContactForm.astro` | `ENDPOINT` → URL Google Apps Script Web App (ghi chú TODO trong file: Apps Script `doPost` ghi vào Google Sheet) |
| `src/components/Testimonials.astro` | 3 đánh giá mẫu → đánh giá thật kèm ảnh giỏ đã giao |
| `public/images/products/*.svg` | Ảnh minh họa SVG → ảnh thật cùng tên `.jpg/.avif`, cập nhật `images[]` trong `products.json` |
| `public/images/hero-*.svg` | Ảnh hero minh họa → ảnh chụp giỏ thật (`hero-1.svg`, `hero-2.svg`, `hero-tile.svg`). Mùa Tết (T11–T2): chỉ cần drop thêm `hero-tet-1.svg`, `hero-tet-2.svg`, `hero-tet-tile.svg` — site tự đổi ảnh slider theo, không phải sửa code |

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
