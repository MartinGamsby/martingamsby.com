// @ts-check
import { defineConfig } from 'astro/config';

// Custom-domain cutover done (2026-06-13): the site is served from the apex
// domain, so `site` is the absolute origin (used for sitemap/RSS/canonical) and
// `base` is root. The custom domain is pinned by `public/CNAME` so the Pages
// deploy doesn't drop it. (HTTPS may lag while GitHub provisions the cert.)
export default defineConfig({
  site: 'https://martingamsby.com',
  base: '/',
});
