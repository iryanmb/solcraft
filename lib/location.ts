"use client";

// Asks the browser where the phone is, once, for a check-in. The result goes straight
// to check_in() and is never saved (CLAUDE.md: never store coordinates).

import type { Position } from "./store";

export class LocationError extends Error {
  reason: "denied" | "unavailable";

  constructor(reason: "denied" | "unavailable") {
    super(
      reason === "denied"
        ? "Location is turned off for Solcraft. Allow it in your browser settings, then try again."
        : "We couldn't confirm your location.",
    );
    this.reason = reason;
  }
}

export function getPosition(): Promise<Position> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) return reject(new LocationError("unavailable"));
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ lat: coords.latitude, lng: coords.longitude, accuracy: coords.accuracy }),
      (error) => reject(new LocationError(error.code === error.PERMISSION_DENIED ? "denied" : "unavailable")),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 60_000 },
    );
  });
}
