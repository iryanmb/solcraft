// Loads the gatherings into Supabase and creates their sessions for the next 8 weeks.
// Run: npm run import            (writes to the database)
//      npm run import -- --dry-run (only prints what it would do)
//
// Reads data/gatherings.csv, data/session-rules.json and data/venue-locations.json.
// Safe to run again: rows are updated in place ("upsert"), and future sessions that the
// rules no longer produce are removed (unless someone has checked in to them).

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { SESSION_WEEKS, TIMEZONE } from "../lib/config.ts";
import { isUnknown, readGatheringsCsv, slugify, venueIds, venueKey, XXX } from "./gatherings-csv.ts";
import { addDays, atlantaToInstant, dayToIso, parse24h, parseClock, sessionsFor, todayInAtlanta, type Rule } from "./sessions.ts";

const dryRun = process.argv.includes("--dry-run");

const rows = readGatheringsCsv();
const rules: Record<string, Rule> = JSON.parse(readFileSync("data/session-rules.json", "utf8")).gatherings;
const locations: Record<string, { lat: number | string; lng: number | string }> = JSON.parse(
  readFileSync("data/venue-locations.json", "utf8"),
).venues;

const problems: string[] = [];

// ---- Hosts, venues, gatherings ------------------------------------------------

const hosts = new Map<string, { id: string; name: string; contact: null }>();
const venues = new Map<string, { id: string; name: string; address: string; lat: number | null; lng: number | null }>();
const ids = venueIds(rows);

const gatherings = rows.map((row) => {
  const hostId = slugify(row.Host);
  // xxx: host contact isn't collected yet.
  hosts.set(hostId, { id: hostId, name: row.Host, contact: null });

  const venueId = ids.get(venueKey(row))!;
  const location = locations[venueId];
  if (!location) problems.push(`No entry for venue "${venueId}" in data/venue-locations.json. Run: npm run geocode`);
  const coordinate = (value: number | string | undefined) => (typeof value === "number" ? value : null); // xxx -> null
  venues.set(venueId, {
    id: venueId,
    name: row.Venue,
    address: row.Address,
    lat: coordinate(location?.lat),
    lng: coordinate(location?.lng),
  });

  return {
    id: slugify(row.Gathering),
    host_id: hostId,
    venue_id: venueId,
    title: row.Gathering,
    art_form: row["Art form"],
    kind: "recurring" as const, // every CSV row is a recurring gathering; no one-time events (comets) yet
    recurrence_text: row.Recurrence,
    start_text: row.Start,
    end_text: row.End,
    how_you_take_part: row["How you take part"],
    why_it_fits: row["Why it fits Solcraft"],
    cost_text: row.Cost,
    age_text: row.Age,
    source_url: row.Source,
    last_verified_at: row["Last verified"],
    status: "published" as const,
  };
});

const gatheringIds = gatherings.map((g) => g.id);
for (const id of new Set(gatheringIds)) {
  if (gatheringIds.filter((other) => other === id).length > 1) problems.push(`Two gatherings would share the id "${id}".`);
}
for (const id of gatheringIds) if (!rules[id]) problems.push(`No entry for "${id}" in data/session-rules.json.`);
for (const id of Object.keys(rules)) if (!gatheringIds.includes(id)) problems.push(`session-rules.json has "${id}", which isn't in the CSV.`);

// ---- Sessions -----------------------------------------------------------------

const from = todayInAtlanta();
const to = addDays(from, SESSION_WEEKS * 7);

const sessions: { gathering_id: string; starts_at: string; ends_at: string | null; status: "scheduled" }[] = [];
const summary: { gathering: string; count: number; next: string; note: string }[] = [];

for (const [index, gathering] of gatherings.entries()) {
  const row = rows[index];
  const rule = rules[gathering.id];
  if (!rule) continue;

  const start = rule.start ? parse24h(rule.start) : parseClock(row.Start);
  const end = rule.end ? parse24h(rule.end) : isUnknown(row.End) ? null : parseClock(row.End);
  if (!start) {
    problems.push(`"${gathering.title}" has no readable start time ("${row.Start}").`);
    continue;
  }

  const times = sessionsFor(rule, start, end, from, to);
  for (const { startsAt, endsAt } of times) {
    sessions.push({
      gathering_id: gathering.id,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt ? endsAt.toISOString() : null,
      status: "scheduled",
    });
  }

  const notes = [
    rule.note,
    end ? "" : `end ${XXX}`,
    isUnknown(row.Address) ? "no address" : "",
    venues.get(gathering.venue_id)?.lat === null ? "no map pin" : "",
  ].filter(Boolean);
  summary.push({
    gathering: gathering.title,
    count: times.length,
    next: times[0]
      ? times[0].startsAt.toLocaleString("en-US", { timeZone: TIMEZONE, weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
      : "—",
    note: notes.join("; "),
  });
}

// ---- Report -------------------------------------------------------------------

console.log(`Sessions from ${dayToIso(from)} to ${dayToIso(to)} (Atlanta), ${SESSION_WEEKS} weeks\n`);
console.table(summary);
console.log(`${hosts.size} hosts · ${venues.size} venues · ${gatherings.length} gatherings · ${sessions.length} sessions`);

if (problems.length) {
  console.error(`\nStopped before writing anything:\n- ${problems.join("\n- ")}`);
  process.exit(1);
}
if (dryRun) {
  console.log("\nDry run: nothing was written.");
  process.exit(0);
}

// ---- Write to Supabase ------------------------------------------------------------

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
if (!url || !secretKey) {
  console.error("\nMissing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local.");
  process.exit(1);
}
// The secret key skips Row Level Security, which is what lets this script write the catalog.
const supabase = createClient(url, secretKey, { auth: { persistSession: false } });

async function upsert(table: string, values: object[], onConflict: string) {
  const { error } = await supabase.from(table).upsert(values, { onConflict });
  if (error) throw new Error(`Writing ${table} failed: ${error.message}`);
  console.log(`✓ ${table}: ${values.length}`);
}

console.log("");
await upsert("hosts", [...hosts.values()], "id");
await upsert("venues", [...venues.values()], "id");
await upsert("gatherings", gatherings, "id");
await upsert("sessions", sessions, "gathering_id,starts_at");

// Future sessions the rules no longer produce (a date was removed or changed).
const wanted = new Set(sessions.map((s) => `${s.gathering_id}|${new Date(s.starts_at).getTime()}`));
const { data: existing, error } = await supabase
  .from("sessions")
  .select("id, gathering_id, starts_at")
  .gte("starts_at", atlantaToInstant(from, { hour: 0, minute: 0 }).toISOString()); // from midnight today, Atlanta time
if (error) throw new Error(`Reading sessions failed: ${error.message}`);

const stale = (existing ?? []).filter((s) => !wanted.has(`${s.gathering_id}|${new Date(s.starts_at).getTime()}`));
for (const session of stale) {
  const { error: deleteError } = await supabase.from("sessions").delete().eq("id", session.id);
  console.log(
    deleteError
      ? `! kept ${session.gathering_id} ${session.starts_at}: it has check-ins (${deleteError.message})`
      : `– removed ${session.gathering_id} ${session.starts_at}`,
  );
}
console.log("\nDone.");
