// Draws one zodiac constellation from data/zodiac-constellations.json (lines + stars).
// Data: d3-celestial, BSD-3-Clause; credited on the Terms page.

import zodiac from "@/data/zodiac-constellations.json";

type Figure = { dates: string; d: string; stars: number[][] }; // stars: [x, y, radius]
const signs = zodiac.signs as Record<string, Figure>;

type ConstellationProps = {
  sign: string;
  /** Width in pixels; the height follows the 300 × 200 shape. */
  width?: number;
  /** Draw the lines, then pop in the stars one by one (skipped with reduced motion). */
  animate?: boolean;
};

export default function Constellation({ sign, width = 340, animate = false }: ConstellationProps) {
  const figure = signs[sign];
  if (!figure) return null;

  // Spread the stars' entrances over about two seconds, whatever their number.
  const step = Math.min(0.12, 1.8 / figure.stars.length);

  return (
    <svg viewBox={zodiac.viewBox} width={width} height={(width * 2) / 3} role="img" aria-label={`The constellation ${sign}`}>
      <path
        className={animate ? "draw" : undefined}
        d={figure.d}
        pathLength={1}
        fill="none"
        stroke="var(--color-sun-light)"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.7}
      />
      {figure.stars.map(([x, y, r], i) => (
        <circle
          key={i}
          className={animate ? "pop" : undefined}
          style={animate ? { animationDelay: `${(0.3 + i * step).toFixed(2)}s` } : undefined}
          cx={x}
          cy={y}
          r={r}
          fill="var(--color-star)"
        />
      ))}
    </svg>
  );
}
