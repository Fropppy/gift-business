import { defineConfig } from 'astro/config';

// GitHub Pages project-site setup (docs.astro.build/en/guides/deploy/github):
// - `site` is https://<username>.github.io with NO repo path.
//   Username "Fropppy" taken from the GitHub account logged into this
//   machine (`gh auth status`) — re-verify it matches the repo owner
//   before the first push.
// - `base` must be the repo name with a leading slash — the site serves at
//   https://<username>.github.io/gift-business/. Skip `base` ONLY for a
//   <username>.github.io repo or when using a custom domain.
// - trailingSlash / build.format: left at defaults ('ignore' / 'directory'),
//   which is correct for GitHub Pages.
export default defineConfig({
  site: 'https://fropppy.github.io',
  base: '/gift-business',
});
