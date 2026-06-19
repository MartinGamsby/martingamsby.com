// Single source of truth for the "trending" decay — shared by BOTH the site
// (src/lib/featured.ts → home gate stars, related constellation, tag galaxy) and the
// CLI preview (tools/fetch-popularity.mjs --list). Plain dependency-free ESM so Node
// and Vite can each import it; keep it that way (no JSON/astro imports here).
//
// LOGARITHMIC decay (gentle): age is measured in TREND_HALF_LIFE_DAYS-wide slices and
// weight = (score + 1) / (log2(slices + 1) + 1). So at 1 slice old it halves, at 3 it's
// a third, at 7 a quarter — old posts keep shrinking but never crash to ~0 the way an
// exponential half-life does, so evergreen posts stay visible. A future-dated post
// (ageDays ≤ 0 → age 0) divides by 1 → full score; the `+1` numerator gives a
// zero-engagement post a pure-recency score so fresh posts rank high by construction.
export const TREND_HALF_LIFE_DAYS = 45;

/**
 * Recency-decayed popularity weight.
 * @param {number} score   raw popularity score
 * @param {number} ageDays days since publication (clamped at 0; future → full score)
 * @returns {number}
 */
export function trendingValue(score, ageDays) {
  const slices = Math.max(0, ageDays) / TREND_HALF_LIFE_DAYS;
  return (score + 1) / (Math.log2(slices + 1) + 1);
}
