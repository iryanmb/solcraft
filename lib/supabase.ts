// The one Supabase client for the whole app. It runs in the browser and keeps you signed
// in on this device. Only lib/store.ts should import it; screens go through the store.

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// NEXT_PUBLIC_ values are copied into the browser code when the app is built. Locally they
// come from .env.local; on Vercel, from the project's Environment Variables.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !publishableKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (in .env.local, or Vercel's Environment Variables).",
  );
}

export const supabase = createClient<Database>(url, publishableKey);
