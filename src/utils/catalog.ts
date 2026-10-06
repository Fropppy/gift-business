import productsJson from '../data/products.json';
import categoriesJson from '../data/categories.json';
import { asset } from './asset';

/**
 * Field names mirror the Medusa Product model 1:1 (or via a trivial rename):
 * slug→handle, name→title, thumbnail/images, category→categories, tags,
 * options, variants, metadata-ish fields (badge, personalization).
 * `price` is a Pricing Module record { amount, currency_code } because prices
 * are NOT on the Medusa product model; `inStock` is a denormalized storefront
 * field (inventory later comes from the Inventory Module).
 * See docs.medusajs.com/resources/references/product/models/Product
 */
export interface Price {
  amount: number;
  currency_code: string;
}

export interface Personalization {
  enabled: boolean;
  type: string;
  label: string;
  maxChars: number;
}

export interface ProductOption {
  name: string;
  values: string[];
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  category: string;
  description: string;
  badge: string | null;
  tags: string[];
  personalization: Personalization;
  price: Price;
  options: ProductOption[];
  variants: unknown[];
  images: string[];
  thumbnail: string | null;
  inStock: boolean;
}

export interface Category {
  slug: string;
  name: string;
  description: string;
  icon: string;
}

export const products: Product[] = (productsJson as { products: Product[] }).products;
export const categories: Category[] = categoriesJson as Category[];

export function categoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

/** "850000" → "850.000₫" (deterministic dot separators — no ICU dependency). */
export function formatVnd(amount: number): string {
  return String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '₫';
}

/** Fallback-safe image resolution: thumbnail → first image → shared placeholder. */
export function productImage(p: Product): string {
  const raw = p.thumbnail || p.images[0] || '/images/products/placeholder.svg';
  return asset(raw);
}

export function relatedProducts(p: Product, limit = 3): Product[] {
  const same = products.filter((x) => x.category === p.category && x.slug !== p.slug);
  const rest = products.filter((x) => x.category !== p.category && x.slug !== p.slug);
  return [...same, ...rest].slice(0, limit);
}

/** Badge text → CSS modifier class (colors live in global.css). */
export function badgeClass(badge: string | null): string {
  switch (badge) {
    case 'Bán chạy':
      return 'badge--hot';
    case 'Mới':
      return 'badge--new';
    case 'Đặt số lượng':
      return 'badge--bulk';
    default:
      return '';
  }
}
