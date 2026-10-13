// App settings in one place. Values marked xxx are stand-ins to confirm before the pilot.

// Every date and time in Solcraft is Atlanta time.
export const TIMEZONE = "America/New_York";

// How far ahead the import creates sessions. Re-running the import later adds the rest.
export const SESSION_WEEKS = 8;

// The I'm here window (1 hour before to 1 hour after; 4 hours after the start when there's
// no end time) and the 150 m check-in radius live only in the database, where they're
// enforced: supabase/migrations/*_checkins_and_moons.sql.

// xxx: the moon card appears on the first open after this hour, the morning after a check-in.
export const MOON_HOUR = 6;

// Digits in the sign-in code. Must match Supabase: Authentication → Sign In / Providers →
// Email → "Email OTP Length".
export const CODE_LENGTH = 6;
