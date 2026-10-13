// Looks up map coordinates for each venue and saves them to data/venue-locations.json.
// Run: npm run geocode
//
// Uses the US Census Geocoder (free, no key, public domain), one request at a time.
// Venues already in the file are skipped, so hand corrections are kept. To redo one,
// delete its entry and run again.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { isUnknown, readGatheringsCsv, venueIds, venueKey, XXX } from "./gatherings-csv.ts";

const OUT = "data/venue-locations.json";

type Location = {
  name: string;
  address: string;
  lat: number | typeof XXX;
  lng: number | typeof XXX;
  matched?: string; // the address the geocoder matched, to compare with ours
  map?: string; // a link to check the pin by eye
  note?: string;
};

type LocationsFile = { about: string; venues: Record<string, Location> };

async function geocode(address: string): Promise<{ lat: number; lng: number; matched: string } | null> {
  const url = new URL("https://geocoding.geo.census.gov/geocoder/locations/onelineaddress");
  url.searchParams.set("address", address);
  url.searchParams.set("benchmark", "Public_AR_Current");
  url.searchParams.set("format", "json");

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Geocoder answered ${response.status} for "${address}"`);
  const body = await response.json();
  const match = body?.result?.addressMatches?.[0];
  if (!match) return null;
  return { lat: match.coordinates.y, lng: match.coordinates.x, matched: match.matchedAddress };
}

const rows = readGatheringsCsv();
const ids = venueIds(rows);

const file: LocationsFile = existsSync(OUT)
  ? JSON.parse(readFileSync(OUT, "utf8"))
  : {
      about:
        "Venue coordinates from the US Census Geocoder (an estimate along the street). Check each map link. " +
        "Fix a pin by editing lat/lng here; xxx means not placed yet.",
      venues: {},
    };

for (const row of rows) {
  const id = ids.get(venueKey(row))!;
  if (file.venues[id]) continue;

  const base = { name: row.Venue, address: row.Address };
  if (isUnknown(row.Address)) {
    file.venues[id] = { ...base, lat: XXX, lng: XXX, note: "xxx: no single address, so no map pin or check-in." };
    console.log(`– ${row.Venue}: address is xxx, skipped`);
    continue;
  }

  const found = await geocode(row.Address);
  if (found) {
    file.venues[id] = {
      ...base,
      lat: Number(found.lat.toFixed(6)),
      lng: Number(found.lng.toFixed(6)),
      matched: found.matched,
      map: `https://www.google.com/maps?q=${found.lat.toFixed(6)},${found.lng.toFixed(6)}`,
    };
    console.log(`✓ ${row.Venue}: ${found.matched}`);
  } else {
    file.venues[id] = { ...base, lat: XXX, lng: XXX, note: "xxx: the geocoder found no match; enter lat/lng by hand." };
    console.log(`✗ ${row.Venue}: no match for "${row.Address}"`);
  }
}

writeFileSync(OUT, JSON.stringify(file, null, 2) + "\n");
console.log(`\nSaved ${Object.keys(file.venues).length} venues to ${OUT}`);
