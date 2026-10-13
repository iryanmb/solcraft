// A planet: one night at a gathering. It reads ?c= from the address, so it sits inside <Suspense>.
import { Suspense } from "react";
import PlanetDetail from "./PlanetDetail";

export default function PlanetPage() {
  return (
    <Suspense fallback={<div className="app-page" aria-busy="true" />}>
      <PlanetDetail />
    </Suspense>
  );
}
