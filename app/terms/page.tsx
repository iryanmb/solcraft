// Terms. xxx: written before the pilot (checkpoint 6).
import zodiac from "@/data/zodiac-constellations.json";

export default function TermsPage() {
  return (
    <article className="page">
      <h1>Terms</h1>
      <p>xxx</p>
      <h2>Credits</h2>
      <p>{zodiac.attribution}</p>
      <p>
        Map: <a href="https://openfreemap.org">OpenFreeMap</a> © <a href="https://www.openmaptiles.org/">OpenMapTiles</a>, data ©{" "}
        <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors. Drawn with MapLibre GL JS (BSD-3-Clause).
      </p>
    </article>
  );
}
