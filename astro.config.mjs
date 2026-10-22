// @ts-check
import { defineConfig } from 'astro/config';
import rehypeFooterIcons from './src/lib/rehype-footer-icons.mjs';
import guidepourRedirects from './src/lib/guidepour-redirects.mjs';
import sitemap from '@astrojs/sitemap';

// Custom-domain cutover done (2026-06-13): the site is served from the apex
// domain, so `site` is the absolute origin (used for sitemap/RSS/canonical) and
// `base` is root. The custom domain is pinned by `public/CNAME` so the Pages
// deploy doesn't drop it. (HTTPS may lag while GitHub provisions the cert.)
export default defineConfig({
  site: 'https://martingamsby.com',
  base: '/',
  // sitemap: every built page (doors, posts, the music game + licenses pages…)
  // goes into /sitemap-index.xml so search engines find pages that are only
  // linked from deep inside the site. The guidepour alias stubs aren't routes,
  // so they stay out; the 404 is dropped by the integration itself.
  integrations: [guidepourRedirects(), sitemap()],
  markdown: {
    rehypePlugins: [rehypeFooterIcons],
  },
});
