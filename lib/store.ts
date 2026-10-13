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

// ---- Discover -------------------------------------------------------------------

// opensAt / closesAt: the I'm here window, worked out by the database (session_windows).
export type Session = { id: string; startsAt: Date; endsAt: Date | null; opensAt: Date; closesAt: Date };

export type DiscoverGathering = {
  id: string;
  title: string;
  artForm: string;
  recurrenceText: string;
  startText: string;
  endText: string;
  howYouTakePart: string;
  whyItFits: string;
  costText: string;
  ageText: string;
  sourceUrl: string;
  lastVerifiedAt: string; // YYYY-MM-DD
  hostName: string;
  venue: { id: string; name: string; address: string; lat: number | null; lng: number | null };
  upcoming: Session[]; // scheduled sessions whose window hasn't closed yet, soonest first
};

// Every published gathering with its venue, host and upcoming sessions, in one request.
export async function getDiscover(now = new Date()): Promise<DiscoverGathering[]> {
  const { data, error } = await supabase
    .from("gatherings")
    .select(
      "id, title, art_form, recurrence_text, start_text, end_text, how_you_take_part, why_it_fits, cost_text, age_text, source_url, last_verified_at, venue:venues(id, name, address, lat, lng), host:hosts(name), sessions:session_windows(id, starts_at, ends_at, status, opens_at, closes_at)",
    )
    .eq("status", "published");
  if (error) throw friendly(error, "Couldn't load gatherings. Try again.");

  return data.map((row) => ({
    id: row.id,
    title: row.title,
    artForm: row.art_form,
    recurrenceText: row.recurrence_text,
    startText: row.start_text,
    endText: row.end_text,
    howYouTakePart: row.how_you_take_part,
    whyItFits: row.why_it_fits,
    costText: row.cost_text,
    ageText: row.age_text,
    sourceUrl: row.source_url,
    lastVerifiedAt: row.last_verified_at,
    hostName: row.host.name,
    venue: row.venue,
    upcoming: row.sessions
      .filter((s) => s.status === "scheduled")
      .map((s) => ({
        id: s.id!,
        startsAt: new Date(s.starts_at!),
        endsAt: s.ends_at ? new Date(s.ends_at) : null,
        opensAt: new Date(s.opens_at!),
        closesAt: new Date(s.closes_at!),
      }))
      .filter((s) => s.closesAt > now)
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime()),
  }));
}

// ---- Check-ins ----------------------------------------------------------------

const MOON_BUCKET = "moon-photos"; // private Storage bucket (see the checkpoint 4 migration)

export type CheckInResult = { checkinId: string; isNew: boolean; planetNumber: number; sunCount: number };
export type Position = { lat: number; lng: number; accuracy: number };

// Checks in through the database's check_in(), which checks the window and the distance,
// then discards the coordinates. pretend: testers only (the dev panel).
export async function checkIn(
  sessionId: string,
  position: Position | null,
  pretend: { place: boolean; time: boolean } = { place: false, time: false },
): Promise<CheckInResult> {
  const { data, error } = await supabase.rpc("check_in", {
    p_session_id: sessionId,
    p_lat: position?.lat,
    p_lng: position?.lng,
    p_accuracy: position?.accuracy,
    p_pretend_place: pretend.place,
    p_pretend_time: pretend.time,
  });
  if (error) {
    const reason = error.message.match(/solcraft:(\w+)/)?.[1];
    const messages: Record<string, string> = {
      location: "We couldn't confirm your location.",
      window: "I'm here isn't open for this session right now.",
      no_venue_location: "This place isn't on the map yet, so you can't check in here.",
      not_tester: "Only test accounts can pretend.",
      no_session: "This session isn't on the calendar anymore.",
      signed_out: "You're signed out. Sign in again.",
      no_profile: "Finish signing up first.",
    };
    throw new StoreError(reason && messages[reason] ? messages[reason] : friendly(error).message);
  }
  const row = data[0];
  return { checkinId: row.checkin_id, isNew: row.is_new, planetNumber: row.planet_number, sunCount: row.sun_count };
}

// One of your check-ins, numbered by the database (planet 1 at a gathering = its sun).
export type MyCheckin = {
  id: string;
  startsAt: Date;
  endsAt: Date | null;
  gatheringId: string;
  title: string;
  artForm: string;
  kind: "recurring" | "one_time";
  venueId: string;
  planetNumber: number;
  step: number; // this check-in's place on the Sun Road
  moon: { word: string; note: string | null; photoPath: string | null } | null;
};

export async function getMyCheckins(): Promise<MyCheckin[]> {
  const { data, error } = await supabase.from("my_checkins").select("*").order("starts_at");
  if (error) throw friendly(error, "Couldn't load your sky. Try again.");
  return data.map((row) => ({
    id: row.id!,
    startsAt: new Date(row.starts_at!),
    endsAt: row.ends_at ? new Date(row.ends_at) : null,
    gatheringId: row.gathering_id!,
    title: row.title!,
    artForm: row.art_form!,
    kind: row.kind === "one_time" ? "one_time" : "recurring",
    venueId: row.venue_id!,
    planetNumber: row.planet_number!,
    step: row.step!,
    moon: row.moon_word ? { word: row.moon_word, note: row.moon_note, photoPath: row.moon_photo_path } : null,
  }));
}

export async function getVenueName(venueId: string): Promise<string> {
  const { data } = await supabase.from("venues").select("name").eq("id", venueId).maybeSingle();
  return data?.name ?? "";
}

// Testers only: delete all your check-ins, their moons and moon photos.
export async function devDeleteMyCheckins(): Promise<number> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user.id;
  if (userId) {
    const { data: files } = await supabase.storage.from(MOON_BUCKET).list(userId);
    if (files?.length) await supabase.storage.from(MOON_BUCKET).remove(files.map((f) => `${userId}/${f.name}`));
  }
  const { data, error } = await supabase.rpc("dev_delete_my_checkins");
  if (error) throw friendly(error, "Only test accounts can do this.");
  return data;
}

// ---- Moons --------------------------------------------------------------------

// Saves the word (creates the moon, or changes its word). Private: only you can read it.
export async function saveMoonWord(checkinId: string, word: string): Promise<void> {
  const { error } = await supabase.from("moons").upsert({ checkin_id: checkinId, word }, { onConflict: "checkin_id" });
  if (error) throw friendly(error, "Couldn't save your moon. Try again.");
}

export async function saveMoonNote(checkinId: string, note: string): Promise<void> {
  const { error } = await supabase
    .from("moons")
    .update({ note: note.trim() || null })
    .eq("checkin_id", checkinId);
  if (error) throw friendly(error, "Couldn't save your line. Try again.");
}

// Uploads a photo (already shrunk and stripped of location data, see lib/photo.ts)
// to your own folder in the private bucket, and links it to the moon.
export async function saveMoonPhoto(checkinId: string, photo: Blob): Promise<string> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user.id;
  if (!userId) throw new StoreError("You're signed out. Sign in again.");
  const path = `${userId}/${checkinId}.jpg`;
  const { error } = await supabase.storage.from(MOON_BUCKET).upload(path, photo, { contentType: "image/jpeg", upsert: true });
  if (error) throw friendly(error, "Couldn't upload the photo. Try again.");
  const { error: linkError } = await supabase.from("moons").update({ photo_path: path }).eq("checkin_id", checkinId);
  if (linkError) throw friendly(linkError, "Couldn't save the photo. Try again.");
  return path;
}

// A private photo can only be shown through a link that expires (here, after an hour).
export async function getMoonPhotoUrl(path: string): Promise<string | null> {
  const { data } = await supabase.storage.from(MOON_BUCKET).createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

// Several private photos at once (the Moons tab), as links that expire after an hour.
export async function getMoonPhotoUrls(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const { data } = await supabase.storage.from(MOON_BUCKET).createSignedUrls(paths, 3600);
  const urls: Record<string, string> = {};
  for (const item of data ?? []) if (item.path && item.signedUrl) urls[item.path] = item.signedUrl;
  return urls;
}

// ---- Sun Road -------------------------------------------------------------------

export type Badge = {
  name: string;
  step: number;
  goal: number;
  progress: number;
  reached: boolean;
  challengeDone: boolean;
  earnedAt: Date | null;
  earnedCheckinId: string | null;
};
export type SunRoad = { nights: number; badges: Badge[] };

// Steps and badges, worked out by the database from your check-ins (my_sun_road()).
export async function getSunRoad(): Promise<SunRoad> {
  const { data, error } = await supabase.rpc("my_sun_road");
  if (error) throw friendly(error, "Couldn't load your Sun Road. Try again.");
  return {
    nights: data[0]?.nights ?? 0,
    badges: data.map((row) => ({
      name: row.badge,
      step: row.step,
      goal: row.goal,
      progress: row.progress,
      reached: row.reached,
      challengeDone: row.challenge_done,
      earnedAt: row.earned_at ? new Date(row.earned_at) : null,
      earnedCheckinId: row.earned_checkin_id,
    })),
  };
}

// ---- Settings -------------------------------------------------------------------

// Changes your name and/or birthday. The database re-checks 18+ and recomputes the sun sign.
export async function updateProfile(changes: { displayName?: string; birthday?: string }): Promise<Profile> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user.id;
  if (!userId) throw new StoreError("You're signed out. Sign in again.");
  const { data, error } = await supabase
    .from("profiles")
    .update({
      ...(changes.displayName !== undefined && { display_name: changes.displayName.trim() }),
      ...(changes.birthday !== undefined && { birthday: changes.birthday }),
    })
    .eq("id", userId)
    .select()
    .single();
  if (error) throw friendly(error, error.code === "42501" ? "Solcraft is for people 18 and older." : "Couldn't save. Try again.");
  return data;
}

// Deletes everything: moon photos first (Storage), then your sign-in, which takes your
// profile, check-ins and moons with it (delete_my_account() in the database).
export async function deleteMyAccount(): Promise<void> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user.id;
  if (!userId) throw new StoreError("You're signed out. Sign in again.");
  const { data: files } = await supabase.storage.from(MOON_BUCKET).list(userId);
  if (files?.length) await supabase.storage.from(MOON_BUCKET).remove(files.map((f) => `${userId}/${f.name}`));
  const { error } = await supabase.rpc("delete_my_account");
  if (error) throw friendly(error, "Couldn't delete your account. Try again.");
  // The account is gone; forget it on this device. (The server answers 403 because the user
  // no longer exists; the local session is cleared anyway.)
  await supabase.auth.signOut({ scope: "local" });
}
