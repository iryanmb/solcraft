// App settings in one place. Values marked xxx are stand-ins to confirm before the pilot.

// Every date and time in Solcraft is Atlanta time.
export const TIMEZONE = "America/New_York";

// How far ahead the import creates sessions. Re-running the import later adds the rest.
export const SESSION_WEEKS = 8;

// The I'm here window opens this long before a session starts and closes this long after it ends.
export const CHECKIN_OPENS_BEFORE_MINUTES = 60;
export const CHECKIN_CLOSES_AFTER_MINUTES = 60;

// xxx: default window for sessions with no end time (confirm before the pilot).
export const NO_END_WINDOW_HOURS = 3;

// xxx: how close to the venue counts as "here", in meters (confirm at a real venue).
export const CHECKIN_RADIUS_METERS = 150;

// xxx: the moon card appears on the first open after this hour, the morning after a check-in.
export const MOON_HOUR = 6;
