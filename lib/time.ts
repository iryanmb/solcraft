// Dates and times in Atlanta, shared by the app and the scripts.
// (Imports end in .ts so the scripts can run this file directly with Node.)

import { TIMEZONE } from "./config.ts";

export type Clock = { hour: number; minute: number }; // 24-hour local time

// A calendar day with no time zone. Stored as a UTC midnight only so date math is easy.
export type Day = Date;

export const dayFromIso = (iso: string): Day => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) throw new Error(`Bad date "${iso}", expected YYYY-MM-DD`);
  return new Date(`${iso}T00:00:00Z`);
};
export const dayToIso = (day: Day) => day.toISOString().slice(0, 10);
export const addDays = (day: Day, n: number): Day => new Date(day.getTime() + n * 86_400_000);

// Today's date in Atlanta (not on this computer's clock, which could be elsewhere).
export function todayInAtlanta(now = new Date()): Day {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  return dayFromIso(parts); // en-CA formats as YYYY-MM-DD
}

// How far Atlanta's clock is ahead of UTC at a given instant, in minutes (-240 in summer, -300 in winter).
function atlantaOffsetMinutes(instant: number): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TIMEZONE,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    })
      .formatToParts(new Date(instant))
      .map((p) => [p.type, Number(p.value)]),
  );
  const asIfUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
  return Math.round((asIfUtc - instant) / 60_000);
}

// A wall-clock time on an Atlanta calendar day -> the real instant. Handles the clock
// change (Nov 1, 2026): the offset is checked again after the first guess.
export function atlantaToInstant(day: Day, clock: Clock): Date {
  const wall = Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), clock.hour, clock.minute);
  let instant = wall - atlantaOffsetMinutes(wall) * 60_000;
  instant = wall - atlantaOffsetMinutes(instant) * 60_000;
  return new Date(instant);
}


// "This week" = Monday 00:00 to the next Monday 00:00, Atlanta time.
export function thisWeekInAtlanta(now = new Date()): { start: Date; end: Date } {
  const today = todayInAtlanta(now);
  const daysSinceMonday = (today.getUTCDay() + 6) % 7; // Monday 0 … Sunday 6
  const monday = addDays(today, -daysSinceMonday);
  const midnight = { hour: 0, minute: 0 };
  return { start: atlantaToInstant(monday, midnight), end: atlantaToInstant(addDays(monday, 7), midnight) };
}

// ---- Showing times on screen (always Atlanta time, whatever the phone's time zone) ----

const parts = (date: Date, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-US", { timeZone: TIMEZONE, ...options }).format(date);

// "9 PM", "7:30 PM"
function clockText(date: Date): string {
  const onTheHour = Number(parts(date, { minute: "numeric" })) === 0;
  return parts(date, onTheHour ? { hour: "numeric" } : { hour: "numeric", minute: "2-digit" });
}

// "Wed, Oct 14"
export function dayText(date: Date): string {
  return parts(date, { weekday: "short", month: "short", day: "numeric" });
}

// "Oct 14"
export function shortDayText(date: Date): string {
  return parts(date, { month: "short", day: "numeric" });
}

// "9–11:30 PM", "8 PM–12 AM", "7:30 PM–xxx" (no end time)
export function timeRangeText(start: Date, end: Date | null): string {
  const from = clockText(start);
  if (!end) return `${from}–xxx`;
  const to = clockText(end);
  const [fromTime, fromHalf] = from.split(" ");
  const [, toHalf] = to.split(" ");
  return fromHalf === toHalf ? `${fromTime}–${to}` : `${from}–${to}`;
}

// "Wed, Oct 14 · 9–11:30 PM"
export function sessionText(start: Date, end: Date | null): string {
  return `${dayText(start)} · ${timeRangeText(start, end)}`;
}
