// The check-in moment. It reads ?c= from the address, so it sits inside <Suspense>.
import { Suspense } from "react";
import CheckedIn from "./CheckedIn";

export default function CheckedInPage() {
  return (
    <Suspense fallback={<div className="moment" aria-busy="true" />}>
      <CheckedIn />
    </Suspense>
  );
}
