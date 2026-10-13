// Reads data/gatherings.csv (the Google Sheet's export) into typed rows.
// Used by geocode-venues.ts and import.ts.

import { readFileSync } from "node:fs";

// The sheet's columns, in order. If the sheet changes, the scripts stop with an error
// instead of quietly reading the wrong column.
const COLUMNS = [
  "Gathering",
  "Art form",
  "Host",
  "Venue",
  "Address",
  "Recurrence",
  "Start",
  "End",
  "Cost",
  "Age",
  "How you take part",
  "Why it fits Solcraft",
  "Source",
  "Last verified",
] as const;

export type CsvRow = Record<(typeof COLUMNS)[number], string>;

// The placeholder marker (see CLAUDE.md). "xxx" alone = unknown; "... xxx" = a best guess.
export const XXX = "xxx";
export const isUnknown = (value: string) => value.trim() === XXX;

// Splits CSV text into rows of cells. Handles quoted cells, which can contain commas
// ("515-B N McDonough St, Decatur, GA") and doubled quotes ("" means one ").
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++; // Windows line ending: \r\n
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

export function readGatheringsCsv(path = "data/gatherings.csv"): CsvRow[] {
  const [header, ...lines] = parseCsv(readFileSync(path, "utf8"));

  if (header.join("|") !== COLUMNS.join("|")) {
    throw new Error(`Unexpected columns in ${path}:\n  got:      ${header.join(", ")}\n  expected: ${COLUMNS.join(", ")}`);
  }

  return lines.map((cells, index) => {
    if (cells.length !== COLUMNS.length) {
      throw new Error(`Row ${index + 2} of ${path} has ${cells.length} cells, expected ${COLUMNS.length}.`);
    }
    const row = Object.fromEntries(COLUMNS.map((name, i) => [name, cells[i].trim()])) as CsvRow;
    for (const name of COLUMNS) {
      if (row[name] === "") {
        throw new Error(`Row ${index + 2} ("${row.Gathering}") has an empty "${name}" cell. Use xxx for unknowns.`);
      }
    }
    return row;
  });
}

// Readable, stable ids: "Joe's Jam Session" -> "joes-jam-session", "Red Light Café" -> "red-light-cafe".
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // drop accents
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// The venue id is made from its name. Two rows with the same venue name but different
// addresses keep separate venues, so nothing is merged by guesswork.
export function venueKey(row: CsvRow): string {
  return `${row.Venue}|${row.Address}`;
}

export function venueIds(rows: CsvRow[]): Map<string, string> {
  const ids = new Map<string, string>(); // venueKey -> id
  const used = new Map<string, number>(); // id -> times used
  for (const row of rows) {
    const key = venueKey(row);
    if (ids.has(key)) continue;
    const base = slugify(row.Venue);
    const count = (used.get(base) ?? 0) + 1;
    used.set(base, count);
    ids.set(key, count === 1 ? base : `${base}-${count}`);
  }
  return ids;
}
