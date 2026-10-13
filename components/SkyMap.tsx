"use client";

// Your Sky, drawn from your check-ins (design/screens/pilot/05a, 05c).
// - Your birth constellation: dim and dashed, with its name.
// - One sun per gathering, in the order you found them, each at a fixed spot (the sky never reshuffles).
// - One ring per night there (up to a few), planets on the rings in the art form's color,
//   a small moon beside any planet that has one.
// - A thin arc of stars joins suns that share an art form (a constellation).

import type { KeyboardEvent } from "react";
import { SUN_POINTS } from "@/components/SunMark";
import zodiac from "@/data/zodiac-constellations.json";
import { artFormColor } from "@/lib/gatherings";

export type SkySun = {
  gatheringId: string;
  title: string;
  artForm: string;
  planets: { checkinId: string; hasMoon: boolean }[]; // every night there, first one included
};

type SkyMapProps = {
  suns: SkySun[]; // in the order you found them
  sign: string; // your birth constellation
  selectedId: string | null;
  onSelect: (gatheringId: string | null) => void;
};

const W = 390;
const H = 460;
// Where the birth constellation sits (a 3:2 box) and the spots suns take, in order.
const BIRTH = { x: 215, y: 190, width: 130, height: 87 };
const SPOTS: [number, number][] = [
  [115, 165], [300, 80], [285, 385], [100, 355], [195, 55], [62, 252],
  [195, 432], [345, 140], [40, 85], [365, 330], [40, 432], [175, 280],
];
const STARS: [number, number, number][] = [
  [20, 20, 1.1], [150, 18, 0.9], [372, 30, 1.2], [250, 140, 0.8], [18, 180, 1], [372, 238, 0.9],
  [160, 210, 1.1], [240, 330, 0.8], [130, 440, 1], [372, 445, 1.1], [60, 300, 0.8], [330, 300, 1],
];
const GOLDEN_ANGLE = 2.39996; // spreads planets evenly around their sun

type Figure = { d: string; stars: number[][] };
const figures = zodiac.signs as Record<string, Figure>;

// A steady number from a gathering's id, so its planets always start at the same angle.
function seed(id: string): number {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return (hash % 628) / 100;
}

const shorten = (text: string, max = 24) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

export default function SkyMap({ suns, sign, selectedId, onSelect }: SkyMapProps) {
  // Fewer rings when the sky gets crowded, so systems don't overlap.
  const maxRings = suns.length <= 4 ? 4 : suns.length <= 8 ? 3 : 2;

  const systems = suns.slice(0, SPOTS.length).map((sun, index) => {
    const [cx, cy] = SPOTS[index];
    const rings = Math.min(sun.planets.length, maxRings);
    const size = 26 + 4 * rings; // the sun grows a little with each ring
    const ringRx = (k: number) => size / 2 + 8 + k * 10;
    const outer = rings ? ringRx(rings) * 0.36 : size / 2;
    const planets = sun.planets.map((planet, i) => {
      const k = Math.min(i + 1, rings);
      const angle = seed(sun.gatheringId) + i * GOLDEN_ANGLE;
      return { ...planet, x: cx + ringRx(k) * Math.cos(angle), y: cy + ringRx(k) * 0.36 * Math.sin(angle) };
    });
    return { ...sun, cx, cy, rings, size, ringRx, labelY: cy + outer + 16, planets };
  });

  // Constellations: consecutive suns of the same art form, joined by a raised arc with three stars.
  const arcs = Object.values(
    systems.reduce<Record<string, typeof systems>>((groups, s) => {
      (groups[s.artForm] ??= []).push(s);
      return groups;
    }, {}),
  ).flatMap((group) =>
    group.slice(1).map((b, i) => {
      const a = group[i];
      const mx = (a.cx + b.cx) / 2;
      const my = (a.cy + b.cy) / 2 - 45;
      const point = (t: number) => ({
        x: (1 - t) ** 2 * a.cx + 2 * (1 - t) * t * mx + t ** 2 * b.cx,
        y: (1 - t) ** 2 * a.cy + 2 * (1 - t) * t * my + t ** 2 * b.cy,
      });
      return { key: `${a.gatheringId}-${b.gatheringId}`, ids: [a.gatheringId, b.gatheringId], d: `M${a.cx} ${a.cy} Q${mx} ${my} ${b.cx} ${b.cy}`, stars: [0.3, 0.5, 0.7].map(point) };
    }),
  );

  const dim = (ids: string[]) => (selectedId && !ids.includes(selectedId) ? 0.25 : 1);
  const figure = figures[sign];

  const onKey = (event: KeyboardEvent, id: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(selectedId === id ? null : id);
    }
  };

  return (
    <svg className="sky-map" viewBox={`0 0 ${W} ${H}`} role="group" aria-label="Your sky">
      {STARS.map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="var(--color-muted)" opacity={0.5} />
      ))}

      {figure && (
        <g opacity={selectedId ? 0.15 : 0.6} aria-label={`Your birth constellation, ${sign}`}>
          <svg x={BIRTH.x} y={BIRTH.y} width={BIRTH.width} height={BIRTH.height} viewBox={zodiac.viewBox} overflow="visible">
            <path d={figure.d} fill="none" stroke="var(--color-muted)" strokeWidth={2.4} strokeDasharray="6 8" strokeLinecap="round" />
            {figure.stars.map(([x, y, r], i) => (
              <circle key={i} cx={x} cy={y} r={r * 1.3} fill="var(--color-muted)" />
            ))}
          </svg>
          <text x={BIRTH.x + BIRTH.width / 2} y={BIRTH.y + BIRTH.height + 18} textAnchor="middle" className="sky-label">
            {sign}
          </text>
        </g>
      )}

      {arcs.map((arc) => (
        <g key={arc.key} opacity={dim(arc.ids)}>
          <path d={arc.d} fill="none" stroke="var(--color-sun-light)" strokeWidth={1} opacity={0.5} />
          {arc.stars.map((star, i) => (
            <circle key={i} cx={star.x} cy={star.y} r={1.8} fill="var(--color-star)" />
          ))}
        </g>
      ))}

      {systems.map((s) => (
        <g
          key={s.gatheringId}
          className="sky-sun"
          role="button"
          tabIndex={0}
          aria-label={`${s.title}, ${s.planets.length} night${s.planets.length === 1 ? "" : "s"}`}
          aria-pressed={selectedId === s.gatheringId}
          opacity={dim([s.gatheringId])}
          onClick={() => onSelect(selectedId === s.gatheringId ? null : s.gatheringId)}
          onKeyDown={(event) => onKey(event, s.gatheringId)}
        >
          {Array.from({ length: s.rings }, (_, k) => (
            <ellipse key={k} cx={s.cx} cy={s.cy} rx={s.ringRx(k + 1)} ry={s.ringRx(k + 1) * 0.36} fill="none" stroke="var(--color-border)" strokeWidth={1.5} />
          ))}
          {s.planets.map((p) => (
            <g key={p.checkinId}>
              <circle cx={p.x} cy={p.y} r={5.5} fill={artFormColor(s.artForm)} />
              {p.hasMoon && <circle cx={p.x + 7.5} cy={p.y - 5} r={2.6} fill="var(--color-moon)" />}
            </g>
          ))}
          <g transform={`translate(${s.cx - s.size / 2} ${s.cy - s.size / 2}) scale(${s.size / 100})`}>
            <polygon points={SUN_POINTS} fill="var(--color-sun)" stroke="var(--color-ink)" strokeWidth={5} strokeLinejoin="round" />
            <circle cx="42" cy="44" r="3.5" fill="var(--color-ink)" />
            <circle cx="58" cy="44" r="3.5" fill="var(--color-ink)" />
            <path d="M38 55 Q50 66 62 55" fill="none" stroke="var(--color-ink)" strokeWidth={5} strokeLinecap="round" />
          </g>
          {/* A bigger invisible circle makes the sun easy to tap. */}
          <circle cx={s.cx} cy={s.cy} r={Math.max(24, s.size / 2 + 8)} fill="transparent" />
          <text x={s.cx} y={s.labelY} textAnchor="middle" className="sky-label">
            {shorten(s.title)}
          </text>
        </g>
      ))}
    </svg>
  );
}
