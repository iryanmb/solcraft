"use client";

// Month / day / year pickers for a birthday (onboarding and Settings). 0 = not chosen yet.

export type BirthdayParts = { month: number; day: number; year: number };

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const THIS_YEAR = new Date().getFullYear();
// Includes years under 18, so a younger person sees why they can't continue.
const YEARS = Array.from({ length: 90 }, (_, i) => THIS_YEAR - 10 - i);

const pad = (n: number) => String(n).padStart(2, "0");
const daysIn = (month: number, year: number) => new Date(year || 2000, month, 0).getDate(); // 2000: a leap year, so Feb 29 is allowed until a year is chosen

export const isComplete = (b: BirthdayParts) => b.month > 0 && b.day > 0 && b.year > 0;
export const toIso = (b: BirthdayParts) => `${b.year}-${pad(b.month)}-${pad(b.day)}`;
export function fromIso(iso: string): BirthdayParts {
  const [year, month, day] = iso.split("-").map(Number);
  return { year, month, day };
}

// 18 or older today, on this device's calendar. The database checks again when saving.
export function isAdult(b: BirthdayParts) {
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  return `${b.year + 18}-${pad(b.month)}-${pad(b.day)}` <= todayIso;
}

export default function BirthdayFields({ value, onChange }: { value: BirthdayParts; onChange: (next: BirthdayParts) => void }) {
  const { month, day, year } = value;
  // Picking a shorter month (or a non-leap year) clears a day that no longer exists.
  const change = (next: BirthdayParts) => onChange(next.month && next.day > daysIn(next.month, next.year) ? { ...next, day: 0 } : next);

  return (
    <div className="select-row">
      <label className="select-label">
        Month
        <select className="field" value={month} onChange={(event) => change({ ...value, month: Number(event.target.value) })}>
          <option value={0} disabled>
            —
          </option>
          {MONTHS.map((label, i) => (
            <option key={label} value={i + 1}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="select-label">
        Day
        <select className="field" value={day} onChange={(event) => change({ ...value, day: Number(event.target.value) })}>
          <option value={0} disabled>
            —
          </option>
          {Array.from({ length: daysIn(month || 1, year) }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1}
            </option>
          ))}
        </select>
      </label>
      <label className="select-label">
        Year
        <select className="field" value={year} onChange={(event) => change({ ...value, year: Number(event.target.value) })}>
          <option value={0} disabled>
            —
          </option>
          {YEARS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
