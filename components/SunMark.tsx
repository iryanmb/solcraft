// The Solcraft sun (original artwork; shape defined in CLAUDE.md).

export const SUN_POINTS =
  "50.0,3.9 57.6,21.7 73.9,8.6 70.4,29.6 90.9,26.4 79.3,42.2 94.8,50.0 80.0,58.0 88.7,72.3 71.7,71.7 72.4,88.8 57.5,78.0 50.0,96.6 41.6,81.5 27.4,89.1 29.1,70.9 8.7,73.8 17.9,58.6 2.6,50.0 20.6,42.1 7.2,25.3 29.7,29.7 25.6,7.7 42.2,21.1";

type SunMarkProps = {
  /** Width and height in pixels. */
  size?: number;
  /** If given, screen readers announce the sun with this text. Leave it out when the sun is decoration. */
  title?: string;
  /** Outline thickness. 3 is the standard; small suns read better at 4–5. */
  strokeWidth?: number;
};

export default function SunMark({ size = 120, title, strokeWidth = 3 }: SunMarkProps) {
  const ink = { fill: "var(--color-ink)" };

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <polygon
        points={SUN_POINTS}
        style={{ fill: "var(--color-sun)", stroke: "var(--color-ink)" }}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <circle cx="42" cy="44" r="2.8" style={ink} />
      <circle cx="58" cy="44" r="2.8" style={ink} />
      <path
        d="M38 55 Q50 66 62 55"
        fill="none"
        style={{ stroke: "var(--color-ink)" }}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}
