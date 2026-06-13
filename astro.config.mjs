// @ts-check
import { defineConfig } from 'astro/config';

// Served from the GitHub Pages *project* URL until the custom-domain cutover
// (the user-site URL martingamsby.github.io belongs to the old FR blog).
// At cutover: site -> 'https://martingamsby.com', base -> undefined.
export default defineConfig({
  site: 'https://martingamsby.github.io',
  base: '/',
});
