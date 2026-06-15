/*
 * ============================================================================
 *  SOCIAL CONSTELLATION — home-page config   (edit THIS file)
 * ============================================================================
 *
 * This is the single place that controls the floating social icons on the
 * home page. Two things you can change per icon:
 *
 *   • gate  — which door/card the icon links to (and takes its colour from).
 *             One of:  'dev' | 'physics' | 'book' | 'music' | 'everything'
 *
 *   • size  — how big the icon is. 1 = normal, 1.4 = 40% bigger, 0.8 = smaller.
 *             (The overall base size for ALL icons is the `--chip-base` clamp in
 *              src/styles/global.css; this `size` multiplies it per icon.)
 *
 * The icons themselves (label, URL, brand glyph) live in ./socials.ts. Here we
 * just attach each one — matched by its `label` — to a gate and a size.
 *
 *   - To move an icon to another card: change its `gate`.
 *   - To resize an icon: change its `size`.
 *   - An icon with no entry here defaults to the 'everything' gate at size 1.
 *   - To add an icon that should appear ONLY on the home page (not in the
 *     footer / links page), add it to `extraSatellites` at the bottom.
 */
import type { IconName } from '../lib/icons';

export type Gate = 'dev' | 'physics' | 'book' | 'music' | 'everything';

/** Attach socials from ./socials.ts (matched by label) to a gate + size. */
export const orbit: Record<string, { gate: Gate; size: number }> = {
  // ── Software / dev ──────────────────────────────────────────────
  GitHub: { gate: 'dev', size: 1.35 },
  LinkedIn: { gate: 'dev', size: 1.2 },

  // ── Physics ─────────────────────────────────────────────────────
  ORCID: { gate: 'physics', size: 1.15 },

  // ── Book ────────────────────────────────────────────────────────
  Typeshare: { gate: 'book', size: 0.95 },

  // ── Music ───────────────────────────────────────────────────────
  YouTube: { gate: 'music', size: 1.25 },

  // ── Everything / general social ─────────────────────────────────
  'X / Twitter': { gate: 'everything', size: 1.0 },
  Bluesky: { gate: 'everything', size: 0.9 },
  Facebook: { gate: 'everything', size: 0.85 },
};

/**
 * Extra icons shown ONLY in the home-page constellation (these are not in
 * ./socials.ts, so they do not appear in the footer or the /links page).
 * Add or remove freely.
 */
export const extraSatellites: {
  label: string;
  url: string;
  icon: IconName;
  gate: Gate;
  size: number;
}[] = [
  // The physics preprint, parked next to the physics gate.
  { label: 'Zenodo', url: 'https://zenodo.org/records/20482196', icon: 'zenodo', gate: 'physics', size: 1.0 },
];
