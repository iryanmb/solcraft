// Prints what the app works out from each CSV row (Under $20, city), for checking by eye.
// Run: npm run check-derived

import { cityOf, isUnderTwenty } from "../lib/gatherings.ts";
import { readGatheringsCsv } from "./gatherings-csv.ts";

const label = (value: boolean | null) => (value === null ? "unknown" : value ? "yes" : "no");

console.table(
  readGatheringsCsv().map((row) => ({
    gathering: row.Gathering,
    cost: row.Cost,
    "under $20": label(isUnderTwenty(row.Cost)),
    city: cityOf(row.Address),
  })),
);
