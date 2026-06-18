// Shared 2-D geometry for the constellations. Used by BOTH the home-page
// Constellation.astro (gates + socials) and the scoped StarMap.astro (related posts /
// tag galaxy), so the "where does a link attach to a node" maths lives in exactly one
// place. Pure functions, no DOM — safe to import into either component's client script.

export interface Box {
  x: number;
  y: number;
  hw: number; // half-width
  hh: number; // half-height
  rad?: number; // corner radius (0 = sharp rectangle)
}

/**
 * Point on a box's border in the direction of (tx,ty). Honours the corner radius: in a
 * rounded-corner zone it returns the point on the arc, not the sharp rectangle corner
 * (which sits in the transparent cut-out, so a link drawn to it stops short of the
 * visible edge — the rounded-pill gap).
 */
export function rectEdge(b: Box, tx: number, ty: number) {
  const dx = tx - b.x, dy = ty - b.y;
  if (!dx && !dy) return { x: b.x, y: b.y };
  const s = Math.min(b.hw / Math.max(Math.abs(dx), 1e-6), b.hh / Math.max(Math.abs(dy), 1e-6));
  const px = b.x + dx * s, py = b.y + dy * s;
  const r = b.rad || 0;
  if (r > 0 && Math.abs(px - b.x) > b.hw - r && Math.abs(py - b.y) > b.hh - r) {
    const ccx = b.x + Math.sign(px - b.x) * (b.hw - r);
    const ccy = b.y + Math.sign(py - b.y) * (b.hh - r);
    const ex = b.x - ccx, ey = b.y - ccy;
    const A = dx * dx + dy * dy;
    const B = 2 * (dx * ex + dy * ey);
    const C = ex * ex + ey * ey - r * r;
    const disc = B * B - 4 * A * C;
    if (disc >= 0) {
      const tt = (-B + Math.sqrt(disc)) / (2 * A);
      return { x: b.x + dx * tt, y: b.y + dy * tt };
    }
  }
  return { x: px, y: py };
}

/** Point on a circle's rim in the direction of (tx,ty). */
export function circEdge(c: { x: number; y: number; radius: number }, tx: number, ty: number) {
  const dx = tx - c.x, dy = ty - c.y, d = Math.hypot(dx, dy) || 1;
  return { x: c.x + (dx / d) * c.radius, y: c.y + (dy / d) * c.radius };
}

/**
 * A point on the rounded-rectangle outline `d` px outside a box, at perimeter fraction
 * p (0..1). Walking this lets a satellite sit anywhere along an edge (or round a
 * corner), clearing the box on every side regardless of its aspect ratio.
 */
export function orbitPoint(b: Box, d: number, p: number) {
  const W = b.hw * 2, H = b.hh * 2, arc = (Math.PI / 2) * d;
  const L = 2 * W + 2 * H + 4 * arc;
  let s = (((p % 1) + 1) % 1) * L;
  const x1 = b.x - b.hw, x2 = b.x + b.hw, y1 = b.y - b.hh, y2 = b.y + b.hh;
  if (s < H) return { x: x2 + d, y: y1 + s }; s -= H;                                          // right ↓
  if (s < arc) { const a = s / d; return { x: x2 + d * Math.cos(a), y: y2 + d * Math.sin(a) }; } s -= arc; // BR
  if (s < W) return { x: x2 - s, y: y2 + d }; s -= W;                                          // bottom ←
  if (s < arc) { const a = Math.PI / 2 + s / d; return { x: x1 + d * Math.cos(a), y: y2 + d * Math.sin(a) }; } s -= arc; // BL
  if (s < H) return { x: x1 - d, y: y2 - s }; s -= H;                                          // left ↑
  if (s < arc) { const a = Math.PI + s / d; return { x: x1 + d * Math.cos(a), y: y1 + d * Math.sin(a) }; } s -= arc; // TL
  if (s < W) return { x: x1 + s, y: y1 - d }; s -= W;                                          // top →
  const a = Math.PI * 1.5 + s / d; return { x: x2 + d * Math.cos(a), y: y1 + d * Math.sin(a) }; // TR
}
