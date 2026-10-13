// The five badges' look and wording. The rules live in the database (my_sun_road()).
// Icons: CLAUDE.md "Badge icons" (24×24 strokes). Challenge wording: design/source/SunRoad.dc.html.

import type { Badge } from "./store";
import { shortDayText } from "./time";

export const BADGE_INFO: Record<string, { icon: string; challenge: string }> = {
  "First Light": {
    icon: "M12 3 L13.8 10.2 L21 12 L13.8 13.8 L12 21 L10.2 13.8 L3 12 L10.2 10.2 Z",
    challenge: "Your first night out",
  },
  Dawn: {
    icon: "M3 17 H21 M7 17 A5 5 0 0 1 17 17 M12 6 V8 M5.6 9.6 L7 11 M18.4 9.6 L17 11",
    challenge: "Come back to a place once",
  },
  Radiant: {
    icon: "M12 9 A3 3 0 1 1 12 15 A3 3 0 1 1 12 9 Z M12 2 V5 M12 19 V22 M2 12 H5 M19 12 H22 M4.9 4.9 L7 7 M17 17 L19.1 19.1 M4.9 19.1 L7 17 M17 7 L19.1 4.9",
    challenge: "Suns in 3 art forms",
  },
  Zenith: {
    icon: "M3 20 Q12 0 21 20 M12 7 A2.5 2.5 0 1 1 12 12 A2.5 2.5 0 1 1 12 7 Z",
    challenge: "5 nights at one place",
  },
  Galaxy: {
    icon: "M12 12 m-1 0 a1 1 0 1 1 2 0 a2.5 2.5 0 1 1 -4 1.5 a4.5 4.5 0 1 1 7.5 -3.5 a6.5 6.5 0 1 1 -10.5 6",
    challenge: "Suns at 8 places",
  },
};

// "Earned Oct 13" · "1 night away" · "Finish the challenge to earn it"
export function badgeStatus(badge: Badge, nights: number): string {
  if (badge.earnedAt) return `Earned ${shortDayText(badge.earnedAt)}`;
  if (badge.reached) return "Finish the challenge to earn it";
  const away = badge.step - nights;
  return away === 1 ? "1 night away" : `${away} nights away`;
}

export function BadgeIcon({ name, size = 24, color = "currentColor" }: { name: string; size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={BADGE_INFO[name]?.icon} />
    </svg>
  );
}
