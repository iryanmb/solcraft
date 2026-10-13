// Copies MapLibre's worker files into public/maplibre/ so the site can serve them.
// MapLibre draws the map in a background "worker", loaded from a URL at runtime;
// Next's build doesn't include it on its own. Runs after every `npm install` (postinstall),
// locally and on Vercel, so the copy always matches the installed version.

import { cpSync, mkdirSync } from "node:fs";

const from = "node_modules/maplibre-gl/dist";
const to = "public/maplibre";

mkdirSync(to, { recursive: true });
for (const file of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
  cpSync(`${from}/${file}`, `${to}/${file}`);
}
console.log(`Copied MapLibre worker files to ${to}/`);
