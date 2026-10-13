"use client";

// "I'm here": asks for the phone's location once, checks in through the database, then
// opens the check-in moment. The check-in is saved before the moment plays, so closing
// the moment never loses it. Errors stay next to the button with Try again.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/components/AppShell";
import { useDevSettings } from "@/lib/dev";
import { getPosition, LocationError } from "@/lib/location";
import { checkIn, StoreError } from "@/lib/store";

type ImHereButtonProps = { sessionId: string };

export default function ImHereButton({ sessionId }: ImHereButtonProps) {
  const router = useRouter();
  const profile = useProfile();
  const dev = useDevSettings(profile.is_tester);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onTap() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const position = dev.pretendPlace ? null : await getPosition();
      const result = await checkIn(sessionId, position, { place: dev.pretendPlace, time: dev.pretendTime });
      router.push(`/checked-in?c=${result.checkinId}`);
    } catch (e) {
      setError(e instanceof StoreError || e instanceof LocationError ? e.message : "We couldn't confirm your location.");
      setBusy(false);
    }
  }

  return (
    <div className="im-here">
      <button type="button" className="btn btn-primary" onClick={onTap} disabled={busy}>
        {busy ? "Checking…" : error ? "Try again" : "I'm here"}
      </button>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
