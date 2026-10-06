# Order pipeline setup (Google Sheet + Apps Script)

Wires the site's enquiry form to a Google Sheet. 15 minutes, once.

## 1. Create the sheet

1. Create a Google Sheet, name it e.g. `Nha Mai — Don hang`.
2. Menu **Extensions → Apps Script**, delete the placeholder code.
3. Paste the whole of `apps-script/Code.gs` into `Code.gs`, save.
4. In the editor's function dropdown pick **`setupSheets`** → **Run**.
   Authorize when asked (it only touches this spreadsheet).
   This creates the `Đơn hàng` sheet with headers + Trạng thái dropdown,
   and the `Sản phẩm` sheet whose columns mirror `src/data/products.json`.

## 2. Deploy the web app

1. **Deploy → New deployment → ⚙ → Web app**.
2. Description: `order webhook`; Execute as: **Me**;
   Who has access: **Anyone**. Deploy.
3. Copy the **Web app URL** (`https://script.google.com/macros/s/…/exec`).

The site POSTs with `mode: 'no-cors'`, so the browser cannot read the
response — that is expected. Verify the endpoint directly instead:

```bash
curl -s -X POST "<YOUR_EXEC_URL>" \
  -H 'Content-Type: text/plain;charset=utf-8' \
  -d '{"name":"My","phone":"0900123456","product":"Giỏ trái cây","message":"test"}'
# → {"ok":true,"orderId":"GQ-20261006-0001"}
# and a new row appears in Đơn hàng
```

`curl -s <YOUR_EXEC_URL>` (GET) must return `ok`.

## 3. Point the site at it

1. Put the `/exec` URL into `src/data/site.json` → `"orderEndpoint"`.
2. Commit + push; the site rebuilds and the form goes live.
   While `orderEndpoint` is empty the form refuses to promise delivery
   and tells visitors to use Zalo/hotline instead — by design.

## 4. Updating the script later

**Deploy → Manage deployments → ✎ (edit) → Version: New version → Deploy**.
The `/exec` URL stays the same; "New deployment" would mint a new one.

## Sheet schema

`Đơn hàng` (orders): Thời gian · Mã đơn · Trạng thái · Tên khách · SĐT/Zalo ·
Sản phẩm quan tâm · Dịp tặng & lời nhắn · Trang nguồn · Ghi chú nội bộ ·
Người phụ trách. Status dropdown: Mới / Đang gọi / Đã tư vấn / Đã chốt /
Đã giao / Huỷ.

`Sản phẩm` (future catalog CMS): columns match `src/data/products.json`
field-for-field, so a build-time sync (sheet → JSON) can drive the catalog
without changing the site.

## Behaviour notes

- Order IDs: `GQ-YYYYMMDD-####`, per-day counter, race-safe via LockService.
- Dedupe: same phone + message within 5 minutes returns the existing order ID.
- Honeypot: a filled `company` field is dropped silently.
- Formula guard: any field whose text starts with `=`, `+`, `-`, `@` (or a
  tab/CR) is stored as plain text via a leading apostrophe, so formulas
  pasted into the form never execute when the sheet is opened. This also
  keeps phones like `+841234567890` from rendering as `8.41235E+11`.
- Timezone: Asia/Ho_Chi_Minh, fixed in code regardless of script TZ setting.
