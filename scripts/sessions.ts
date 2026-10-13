// Turns a gathering's rule (an RRULE or a list of dates) plus its start/end times into
// session start and end instants. Dates are calendar days in Atlanta; the database stores
// instants (timestamptz), so each local time is converted to UTC here.

import { TIMEZONE } from "../lib/config.ts";

export type Rule = { rrule?: string; dates?: string[]; start?: string; end?: string; note?: string };
export type Clock = { hour: number; minute: number }; // 24-hour local time
export type SessionTimes = { startsAt: Date; endsAt: Date | null };

// A calendar day with no time zone. Stored as a UTC midnight only so date math is easy.
type Day = Date;

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

// "9:15 PM (doors 8:30)" -> 21:15. "About 10:00 PM xxx" -> 22:00. "12:00 AM" -> 0:00. "xxx" -> null.
export function parseClock(text: string): Clock | null {
  const match = text.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;
  let hour = Number(match[1]) % 12;
  if (match[3].toUpperCase() === "PM") hour += 12;
  return { hour, minute: Number(match[2]) };
}

// "20:30" (from session-rules.json) -> 20:30
export function parse24h(text: string): Clock {
  const match = text.match(/^(\d{2}):(\d{2})$/);
  if (!match) throw new Error(`Bad time "${text}", expected HH:MM`);
  return { hour: Number(match[1]), minute: Number(match[2]) };
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

const WEEKDAYS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

// Supports the small part of RRULE that session-rules.json uses:
//   FREQ=WEEKLY;BYDAY=MO,TU[;UNTIL=YYYYMMDD]    every listed weekday
//   FREQ=MONTHLY;BYDAY=3TH[;UNTIL=YYYYMMDD]     the 3rd Thursday (1–5, or -1 for the last)
// Anything else stops the import, so a typo can't silently make wrong dates.
function rruleDays(rrule: string, from: Day, to: Day): Day[] {
  const parts = Object.fromEntries(rrule.split(";").map((p) => p.split("=") as [string, string]));
  for (const key of Object.keys(parts)) {
    if (!["FREQ", "BYDAY", "UNTIL"].includes(key)) throw new Error(`Unsupported RRULE part "${key}" in "${rrule}"`);
  }
  const until = parts.UNTIL ? dayFromIso(`${parts.UNTIL.slice(0, 4)}-${parts.UNTIL.slice(4, 6)}-${parts.UNTIL.slice(6, 8)}`) : null;
  const last = until && until < to ? until : to;

  const byDay = (parts.BYDAY ?? "").split(",").map((code) => {
    const match = code.match(/^(-1|[1-5])?(SU|MO|TU|WE|TH|FR|SA)$/);
    if (!match) throw new Error(`Bad BYDAY "${code}" in "${rrule}"`);
    return { nth: match[1] ? Number(match[1]) : null, weekday: WEEKDAYS.indexOf(match[2]) };
  });

  const days: Day[] = [];
  for (let day = from; day <= last; day = addDays(day, 1)) {
    const matches = byDay.some(({ nth, weekday }) => {
      if (day.getUTCDay() !== weekday) return false;
      if (parts.FREQ === "WEEKLY") {
        if (nth !== null) throw new Error(`WEEKLY rules can't use "${nth}${WEEKDAYS[weekday]}" in "${rrule}"`);
        return true;
      }
      if (parts.FREQ === "MONTHLY") {
        if (nth === null) throw new Error(`MONTHLY rules need a number before the day, e.g. 3TH, in "${rrule}"`);
        const date = day.getUTCDate();
        if (nth === -1) return addDays(day, 7).getUTCMonth() !== day.getUTCMonth();
        return Math.ceil(date / 7) === nth;
      }
      throw new Error(`Unsupported FREQ "${parts.FREQ}" in "${rrule}"`);
    });
    if (matches) days.push(day);
  }
  return days;
}

// All sessions for one gathering between two Atlanta days (both included).
export function sessionsFor(rule: Rule, start: Clock, end: Clock | null, from: Day, to: Day): SessionTimes[] {
  if (rule.rrule && rule.dates) throw new Error("A rule has both rrule and dates; use one.");

  const days = rule.rrule
    ? rruleDays(rule.rrule, from, to)
    : (rule.dates ?? []).map(dayFromIso).filter((day) => day >= from && day <= to);

  return days.map((day) => {
    const startsAt = atlantaToInstant(day, start);
    if (!end) return { startsAt, endsAt: null };
    // An end at or before the start means the night runs past midnight (e.g. 10 PM to 2 AM).
    const endsLater = end.hour * 60 + end.minute > start.hour * 60 + start.minute;
    return { startsAt, endsAt: atlantaToInstant(endsLater ? day : addDays(day, 1), end) };
  });
}
