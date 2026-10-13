// The morning moon. It reads ?c= from the address, so it sits inside <Suspense>.
import { Suspense } from "react";
import MoonCard from "./MoonCard";

export default function MoonPage() {
  return (
    <Suspense fallback={<div className="screen" aria-busy="true" />}>
      <MoonCard />
    </Suspense>
  );
}
