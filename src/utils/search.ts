/**
 * Vietnamese diacritic-insensitive matching for the catalog text search.
 *
 * fold() builds a lowercase ASCII-ish key from any string:
 *   1. toLowerCase()        — also maps Đ → đ
 *   2. NFD decompose        — every tone mark becomes a combining mark
 *   3. strip U+0300–U+036F  — the combining-mark block that carries
 *                             Vietnamese diacritics
 *   4. đ → d                — đ has NO canonical decomposition to strip, so
 *                             the explicit map is what makes "do" match "đỏ"
 *
 * The same fold runs on the build-time index (ProductGrid.astro frontmatter)
 * and on the live query, so toneless "gio qua" and full-tone "giỏ quà"
 * behave identically in both directions.
 *
 * Test oracle — acceptance table measured on the real 16-product catalog
 * (fold both sides, token-AND by substring containment). Reproduce exactly:
 *   giỏ quà → 12 · gio qua → 12 · qua tet → 8 · bieu sep → 4 ·
 *   qua gio tet → 5 · trai cay → 4 · zzz-nope → 0 · "t" → not a filter
 *   (min length 2 — a single letter matches 16/16).
 */

export function fold(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

/** Token-AND: every (folded) token must appear in the (folded) haystack.
 * An empty token list matches everything. */
export function matchesTokens(tokens: string[], foldedHaystack: string): boolean {
  return tokens.every((token) => foldedHaystack.includes(token));
}
