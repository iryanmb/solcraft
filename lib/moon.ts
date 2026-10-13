"use client";

// When a moon is offered: on the first open from MOON_HOUR (6 AM) on the day after the
// session started, Atlanta time, for a check-in that has no moon yet. Only the last week's
// check-ins, most recent first. "Not now" hides one on this device.

import { MOON_HOUR } from "./config";
import type { MyCheckin } from "./store";
import { addDays, atlantaHour, dayToIso, todayInAtlanta } from "./time";

const DISMISSED_KEY = "solcraft-moons-not-now";

export function dismissedMoons(): string[] {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function dismissMoon(checkinId: string) {
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...dismissedMoons(), checkinId]));
  } catch {
    // ignore: it will be offered again next time
  }
}

// ignoreTiming: the dev panel's "Show the moon now" (also offers tonight's check-in).
export function pendingMoon(checkins: MyCheckin[], now = new Date(), ignoreTiming = false): MyCheckin | null {
  const today = dayToIso(todayInAtlanta(now));
  const yesterday = dayToIso(addDays(todayInAtlanta(now), -1));
  const weekAgo = dayToIso(addDays(todayInAtlanta(now), -7));
  const skipped = new Set(dismissedMoons());

  const due = checkins.filter((c) => {
    if (c.moon || skipped.has(c.id)) return false;
    const day = dayToIso(todayInAtlanta(c.startsAt)); // the session's date in Atlanta
    if (ignoreTiming) return day >= weekAgo;
    if (day >= today || day < weekAgo) return false;
    return day < yesterday || atlantaHour(now) >= MOON_HOUR;
  });
  return due.sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime())[0] ?? null;
}
