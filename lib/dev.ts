"use client";

// The dev panel's switches, kept on this device. They only take effect for tester accounts:
// the database refuses "pretend" check-ins from anyone else.
// xxx: before the pilot, set NEXT_PUBLIC_DEV_PANEL=off on Vercel to hide the panel entirely.

import { useSyncExternalStore } from "react";

export type DevSettings = { pretendPlace: boolean; pretendTime: boolean; moonNow: boolean };
const OFF: DevSettings = { pretendPlace: false, pretendTime: false, moonNow: false };

const SETTINGS_KEY = "solcraft-dev-settings";
const FLAG_KEY = "solcraft-dev"; // set by opening any page with ?dev=1 (cleared with ?dev=0)

// Browser storage can be missing or blocked (private windows), so every use is wrapped.
const read = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const write = (key: string, value: string | null) => {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // ignore: the switch just won't be remembered
  }
};

// Shown when: you're a tester, it isn't switched off for this deploy, and you're on
// localhost or have opened the site once with ?dev=1.
export function devPanelAllowed(isTester: boolean): boolean {
  if (!isTester || process.env.NEXT_PUBLIC_DEV_PANEL === "off" || typeof window === "undefined") return false;
  return ["localhost", "127.0.0.1"].includes(window.location.hostname) || read(FLAG_KEY) === "1";
}

// Called once when the app opens: ?dev=1 remembers the panel on this device, ?dev=0 forgets it.
export function rememberDevFlagFromUrl() {
  const dev = new URLSearchParams(window.location.search).get("dev");
  if (dev === "1") write(FLAG_KEY, "1");
  if (dev === "0") write(FLAG_KEY, null);
}

// ---- Settings as a tiny shared store, so every screen sees a change at once ------------

const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cached: DevSettings = OFF;

function snapshot(): DevSettings {
  const raw = read(SETTINGS_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cached = raw ? { ...OFF, ...JSON.parse(raw) } : OFF;
    } catch {
      cached = OFF;
    }
  }
  return cached;
}

export function setDevSetting(name: keyof DevSettings, value: boolean) {
  write(SETTINGS_KEY, JSON.stringify({ ...snapshot(), [name]: value }));
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// The switches, or all off when the panel isn't allowed for this person.
export function useDevSettings(isTester: boolean): DevSettings {
  const settings = useSyncExternalStore(subscribe, snapshot, () => OFF);
  return isTester && devPanelAllowed(isTester) ? settings : OFF;
}
