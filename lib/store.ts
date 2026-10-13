// The only place screens get data from. Each function talks to Supabase and turns its
// errors into short messages a person can act on. If the data source ever changes,
// only this file changes.

import { supabase } from "./supabase";
import type { Database } from "./database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

// Who is using the app right now: null = signed out; profile null = signed in but
// onboarding (name + birthday) isn't finished.
export type Account = { userId: string; email: string; profile: Profile | null } | null;

// An error whose message is safe to show on screen.
export class StoreError extends Error {}

type SupabaseError = { message: string; status?: number; code?: string };

// The messages that apply anywhere. `otherwise` is the message for this particular step.
function friendly(error: SupabaseError, otherwise = "Something went wrong. Try again."): StoreError {
  const message = error.message.toLowerCase();
  if (error.status === 429 || message.includes("rate limit") || message.includes("security purposes")) {
    return new StoreError("Too many tries. Wait a minute, then try again.");
  }
  if (message.includes("fetch") || message.includes("network")) {
    return new StoreError("No connection. Check your internet and try again.");
  }
  return new StoreError(otherwise);
}

// ---- Sign-in (email + 6-digit code) -------------------------------------------

// Emails a 6-digit code. Creates the account the first time; the same flow signs you in later.
export async function sendCode(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  if (error) {
    const badAddress = error.message.toLowerCase().includes("email");
    throw friendly(error, badAddress ? "Check the email address." : undefined);
  }
}

// Checks the code. On success Supabase keeps you signed in on this device.
export async function verifyCode(email: string, code: string): Promise<void> {
  const { error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
  if (error) throw friendly(error, "That code didn't work. Check it, or send a new one.");
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw friendly(error);
}

// ---- Account and profile ------------------------------------------------------

export async function getAccount(): Promise<Account> {
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user) return null;
  return { userId: user.id, email: user.email ?? "", profile: await getMyProfile(user.id) };
}

async function getMyProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw friendly(error);
  return data;
}

// Saves name and birthday (YYYY-MM-DD). The database works out the sun sign and refuses
// anyone under 18. Returns the saved profile, sun sign included.
export async function createProfile(displayName: string, birthday: string): Promise<Profile> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user.id;
  if (!userId) throw new StoreError("You're signed out. Start again.");

  const { data, error } = await supabase
    .from("profiles")
    .insert({ id: userId, display_name: displayName.trim(), birthday })
    .select()
    .single();
  if (error?.code === "23505") {
    // A profile already exists (a double tap, or a second tab): use the saved one.
    const existing = await getMyProfile(userId);
    if (existing) return existing;
  }
  // 42501 = refused by Row Level Security, which here means under 18.
  if (error) throw friendly(error, error.code === "42501" ? "Solcraft is for people 18 and older." : undefined);
  return data;
}
