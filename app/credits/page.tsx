// Credits: the open data and tools Solcraft is built with (CLAUDE.md: credit d3-celestial).
import Link from "next/link";
import zodiac from "@/data/zodiac-constellations.json";

export default function CreditsPage() {
  return (
    <article className="page">
      <h1>Credits</h1>
      <h2>Constellations</h2>
      <p>{zodiac.attribution}</p>
      <h2>Map</h2>
      <p>
        <a href="https://openfreemap.org">OpenFreeMap</a> © <a href="https://www.openmaptiles.org/">OpenMapTiles</a>, data ©{" "}
        <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors. Drawn with{" "}
        <a href="https://maplibre.org">MapLibre GL JS</a> (BSD-3-Clause).
      </p>
      <h2>Gatherings</h2>
      <p>Each gathering links to the source its details came from.</p>
      <p>
        <Link href="/terms">Terms</Link> · <Link href="/privacy">Privacy Policy</Link>
      </p>
    </article>
  );
}
