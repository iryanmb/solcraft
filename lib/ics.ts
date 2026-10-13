// Plan it: a calendar file (.ics) for one session, opened by the phone's own calendar app.
// No reminders: Solcraft doesn't add alerts to people's calendars (DECISIONS.md).

type CalendarEvent = {
  id: string; // stays the same, so adding it twice updates the same event
  title: string;
  startsAt: Date;
  endsAt: Date | null; // left out when unknown
  location: string;
  description: string;
  url: string;
};

// 2026-10-15T01:00:00.000Z -> 20261015T010000Z
const stamp = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

// Calendar text escapes backslashes, commas, semicolons and line breaks.
const text = (value: string) => value.replace(/\\/g, "\\\\").replace(/([,;])/g, "\\$1").replace(/\r?\n/g, "\\n");

// Lines longer than 75 characters continue on the next line, starting with a space.
const fold = (line: string) => line.match(/.{1,74}/g)!.join("\r\n ");

export function buildIcs(event: CalendarEvent, now = new Date()): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Solcraft//Plan it//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.id}@solcraft`,
    `DTSTAMP:${stamp(now)}`,
    `DTSTART:${stamp(event.startsAt)}`,
    ...(event.endsAt ? [`DTEND:${stamp(event.endsAt)}`] : []),
    `SUMMARY:${text(event.title)}`,
    `LOCATION:${text(event.location)}`,
    `DESCRIPTION:${text(event.description)}`,
    `URL:${event.url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}

// Hands the file to the browser; on a phone this opens "Add to Calendar".
export function downloadIcs(filename: string, ics: string) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 10_000);
}
