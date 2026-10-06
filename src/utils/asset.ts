/**
 * Prefix a public/ asset URL (or an internal page path) with the deploy base.
 *
 * Astro config reference: "When using this option [base], all of your static
 * asset imports and URLs should add the base as a prefix. You can access this
 * value via import.meta.env.BASE_URL."
 *
 * Without this, src="/images/..." silently 404s under the GitHub Pages
 * subpath https://<username>.github.io/gift-business/.
 */
export const asset = (p: string) => import.meta.env.BASE_URL.replace(/\/$/, '') + p;
