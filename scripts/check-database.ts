// Checks the database the way the app will see it: with the PUBLIC (publishable) key only.
// Run after `npm run import`:  npm run check-db
//
// Proves three things: the catalog is readable, private tables and writes are refused
// (Row Level Security works), and the database's sun signs match zodiac-constellations.json.

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !publishableKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local.");
  process.exit(1);
}
const supabase = createClient(url, publishableKey, { auth: { persistSession: false } });

let failures = 0;
const pass = (message: string) => console.log(`✓ ${message}`);
const fail = (message: string) => {
  failures++;
  console.log(`✗ ${message}`);
};

// 1. The catalog is public.
for (const table of ["hosts", "venues", "gatherings", "sessions"]) {
  const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
  if (error) fail(`${table}: can't read (${error.message})`);
  else pass(`${table}: ${count} rows readable`);
}

// The I'm here window, worked out by the database, is public too.
{
  const { data, error } = await supabase.from("session_windows").select("starts_at, ends_at, opens_at, closes_at").limit(1);
  if (error || !data?.length) fail(`session_windows: can't read (${error?.message ?? "no rows"})`);
  else pass(`session_windows: readable (opens ${(new Date(data[0].starts_at!).getTime() - new Date(data[0].opens_at!).getTime()) / 60000} min before the start)`);
}

// 2. Private tables show nothing to someone who isn't signed in.
for (const table of ["profiles", "checkins", "moons", "my_checkins"] as const) {
  const { data, error } = await supabase.from(table).select("*").limit(1);
  if (error || data.length === 0) pass(`${table}: hidden (${error ? "refused" : "0 rows visible"})`);
  else fail(`${table}: rows are visible without signing in`);
}

// 3. Nobody can change the catalog or create check-ins with the public key.
const attempts = [
  ["change a gathering", supabase.from("gatherings").update({ title: "hacked" }).eq("id", "friday-jazz").select()],
  ["add a venue", supabase.from("venues").insert({ id: "test", name: "Test", address: "Test" }).select()],
  ["delete sessions", supabase.from("sessions").delete().eq("gathering_id", "friday-jazz").select()],
  ["create a check-in", supabase.from("checkins").insert({ session_id: crypto.randomUUID(), method: "location" }).select()],
  ["check in without signing in", supabase.rpc("check_in", { p_session_id: crypto.randomUUID(), p_pretend_place: true, p_pretend_time: true })],
  ["delete check-ins without signing in", supabase.rpc("dev_delete_my_checkins")],
  ["read a Sun Road without signing in", supabase.rpc("my_sun_road")],
] as const;
for (const [label, attempt] of attempts) {
  const { data, error } = await attempt;
  if (error || !data || (Array.isArray(data) && data.length === 0)) pass(`can't ${label}`);
  else fail(`was able to ${label}!`);
}

// 4. Sun signs: the database function agrees with the JSON on every sign's first and last day.
const signs: Record<string, { dates: string }> = JSON.parse(readFileSync("data/zodiac-constellations.json", "utf8")).signs;
const failuresBefore = failures;
for (const [sign, { dates }] of Object.entries(signs)) {
  for (const monthDay of dates.split("/")) {
    const { data, error } = await supabase.rpc("sun_sign_for", { birthday: `2004-${monthDay}` });
    if (error) fail(`sun_sign_for(${monthDay}): ${error.message}`);
    else if (data !== sign) fail(`sun_sign_for(${monthDay}) = ${data}, JSON says ${sign}`);
  }
}
if (failures === failuresBefore) pass("sun signs: database matches zodiac-constellations.json on all 24 boundary days");

// 5. Venues without a map pin (no check-in possible there yet).
const { data: unplaced } = await supabase.from("venues").select("name").is("lat", null);
for (const venue of unplaced ?? []) console.log(`– no map pin yet: ${venue.name} (xxx in data/venue-locations.json)`);

console.log(failures ? `\n${failures} check(s) failed.` : "\nAll checks passed.");
process.exit(failures ? 1 : 0);
