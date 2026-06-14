/*
 * Brand / website icons, one consistent pack so every social or external link
 * looks the same. Source: Font Awesome Free (brands + solid), CC BY 4.0
 * (https://fontawesome.com/license/free). Path data is inlined as zero-JS SVG
 * at build time — nothing from the package ships to the client. Long-tail links
 * with no brand glyph (Zenodo, DOI, Typeshare, generic sites) fall back to a
 * neutral globe so the row still reads as a uniform set.
 */
import {
  faYoutube,
  faBluesky,
  faXTwitter,
  faFacebookF,
  faGithub,
  faLinkedinIn,
  faOrcid,
  faAmazon,
} from '@fortawesome/free-brands-svg-icons';
import { faGlobe } from '@fortawesome/free-solid-svg-icons';

const defs = {
  youtube: faYoutube,
  bluesky: faBluesky,
  x: faXTwitter,
  facebook: faFacebookF,
  github: faGithub,
  linkedin: faLinkedinIn,
  orcid: faOrcid,
  amazon: faAmazon,
  // No dedicated brand glyph in the pack — keep the set uniform with the globe.
  typeshare: faGlobe,
  zenodo: faGlobe,
  doi: faGlobe,
  web: faGlobe,
} as const;

export type IconName = keyof typeof defs;

/** viewBox + path for an icon, ready to inline into an <svg>. */
export function getIcon(name: IconName): { viewBox: string; d: string } {
  const [w, h, , , path] = (defs[name] ?? faGlobe).icon;
  return { viewBox: `0 0 ${w} ${h}`, d: Array.isArray(path) ? path.join(' ') : path };
}
