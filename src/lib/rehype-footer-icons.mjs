/*
 * Build-time rehype plugin: gives the end-of-post footer bullets the same brand
 * icons as the social links. WriterHelper renders the footer as a markdown list
 * of `- [Label](url)` lines drawn from a fixed slot set (see WriterHelper
 * `webapi.py` LINK_SLOTS + the dynamic "Based on" / "Basé sur" slot). When a list
 * item is exactly one link whose visible text matches one of those labels, we
 * inline the matching glyph (from src/lib/icons.ts — the social-link icon pack)
 * before the text. Zero JS: the SVG is baked into the static HTML.
 *
 * Matching is deliberately strict (single `<a>` child, exact label) so only the
 * deterministic WriterHelper footer is decorated, not arbitrary body links.
 */
import { getIcon } from './icons.ts';

// Label → icon name. Keys are the exact strings WriterHelper emits. Non-brand
// slots (Medium/Source/Based on…) fall back to the globe, mirroring how the
// social row treats long-tail links.
const LABEL_ICON = {
  'Medium': 'web',
  'Typeshare': 'typeshare',
  'X/Twitter': 'x',
  'Version courte: X/Twitter': 'x',
  'LinkedIn': 'linkedin',
  'Facebook': 'facebook',
  'Bluesky': 'bluesky',
  'YouTube': 'youtube',
  'YouTube Shorts': 'youtube',
  'Source': 'web',
  'Based on': 'web',
  'Basé sur': 'web',
};

function textOf(node) {
  if (node.type === 'text') return node.value;
  if (node.children) return node.children.map(textOf).join('');
  return '';
}

function iconSvg(name) {
  const { viewBox, d } = getIcon(name);
  return {
    type: 'element',
    tagName: 'svg',
    properties: {
      className: ['icon'],
      width: 16,
      height: 16,
      viewBox,
      fill: 'currentColor',
      'aria-hidden': 'true',
      focusable: 'false',
    },
    children: [{ type: 'element', tagName: 'path', properties: { d }, children: [] }],
  };
}

function visit(node) {
  if (!node.children) return;
  if (node.tagName === 'li') {
    // Only decorate a clean footer bullet: exactly one element child, an <a>.
    const kids = node.children.filter(
      (c) => !(c.type === 'text' && c.value.trim() === '')
    );
    if (kids.length === 1 && kids[0].type === 'element' && kids[0].tagName === 'a') {
      const a = kids[0];
      const label = textOf(a).trim();
      const icon = LABEL_ICON[label];
      if (icon) {
        a.properties = a.properties || {};
        const cls = a.properties.className || [];
        a.properties.className = Array.isArray(cls) ? [...cls, 'footer-link'] : [cls, 'footer-link'];
        a.children.unshift(iconSvg(icon));
        const lcls = node.properties?.className || [];
        node.properties = node.properties || {};
        node.properties.className = Array.isArray(lcls) ? [...lcls, 'footer-item'] : [lcls, 'footer-item'];
        return; // no need to descend further into this li
      }
    }
  }
  for (const child of node.children) visit(child);
}

export default function rehypeFooterIcons() {
  return (tree) => visit(tree);
}
