"use client";

// Leave a moon (design/screens/pilot/04): one word, an optional line, an optional photo.
// Tapping a word saves the moon at once; the line saves as you type. Moons are private.

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { artFormColor } from "@/lib/gatherings";
import { dismissMoon } from "@/lib/moon";
import { preparePhoto } from "@/lib/photo";
import { getMoonPhotoUrl, getMyCheckins, saveMoonNote, saveMoonPhoto, saveMoonWord, StoreError, type MyCheckin } from "@/lib/store";
import { addDays, dayText, dayToIso, partOfDayText, todayInAtlanta } from "@/lib/time";
import { useAccount } from "@/lib/useAccount";

const WORDS = ["Moved", "Joyful", "Inspired", "Calm", "Curious", "Not for me"]; // CLAUDE.md
const messageOf = (e: unknown) => (e instanceof StoreError ? e.message : "Something went wrong. Try again.");

export default function MoonCard() {
  const router = useRouter();
  const checkinId = useSearchParams().get("c");
  const account = useAccount();
  const [checkin, setCheckin] = useState<MyCheckin | null>(null);
  const [word, setWord] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [error, setError] = useState("");
  const noteTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (account === null) {
      router.replace("/welcome");
      return;
    }
    if (!account || !checkinId) return;
    let current = true;
    getMyCheckins().then(async (all) => {
      const found = all.find((c) => c.id === checkinId);
      if (!current) return;
      if (!found) {
        router.replace("/sky");
        return;
      }
      setCheckin(found);
      setWord(found.moon?.word ?? null);
      setNote(found.moon?.note ?? "");
      if (found.moon?.photoPath) {
        const url = await getMoonPhotoUrl(found.moon.photoPath);
        if (current) setPhotoUrl(url);
      }
    });
    return () => {
      current = false;
    };
  }, [account, checkinId, router]);

  if (!checkin) return <div className="screen" aria-busy="true" />;

  const sessionDay = dayToIso(todayInAtlanta(checkin.startsAt));
  const yesterday = dayToIso(addDays(todayInAtlanta(), -1));
  const when = sessionDay === yesterday ? "Last night" : dayText(checkin.startsAt);
  const what = checkin.planetNumber === 1 ? "a new sun" : `planet ${checkin.planetNumber}`;

  async function pick(next: string) {
    setError("");
    const before = word;
    setWord(next);
    try {
      await saveMoonWord(checkin!.id, next);
    } catch (e) {
      setWord(before);
      setError(messageOf(e));
    }
  }

  function changeNote(value: string) {
    setNote(value);
    clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => saveMoonNote(checkin!.id, value).catch((e) => setError(messageOf(e))), 800);
  }

  async function addPhoto(file: File) {
    setError("");
    setPhotoBusy(true);
    try {
      const photo = await preparePhoto(file);
      await saveMoonPhoto(checkin!.id, photo);
      setPhotoUrl(URL.createObjectURL(photo));
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setPhotoBusy(false);
    }
  }

  function leave() {
    clearTimeout(noteTimer.current);
    if (word) saveMoonNote(checkin!.id, note).catch(() => {});
    else dismissMoon(checkin!.id); // "Not now": don't offer this one again on this device
    router.replace("/sky");
  }

  return (
    <div className="screen moon-screen">
      <div className="screen-body">
        <p className="eyebrow">{partOfDayText()}</p>
        <div className="moon-night">
          <svg viewBox="0 0 120 80" width="108" height="72" aria-hidden="true">
            <ellipse cx="54" cy="46" rx="50" ry="13" fill="none" stroke="var(--color-border)" strokeWidth="4" />
            <circle cx="54" cy="46" r="30" fill={artFormColor(checkin.artForm)} />
            <path d="M4 46 A50 13 0 0 0 104 46" fill="none" stroke="var(--color-border)" strokeWidth="4" />
            <circle cx="100" cy="14" r="13" fill={word ? "var(--color-moon)" : "none"} stroke="var(--color-moon)" strokeWidth="2" />
          </svg>
          <div>
            <p className="moon-night-when">
              {when} · {what}
            </p>
            <p className="moon-night-title">{checkin.title}</p>
          </div>
        </div>

        <h1 className="screen-title big moon-title">Leave a moon?</h1>
        <p className="screen-sub">One tap for how it felt. It stays private.</p>

        <div className="moon-words" role="group" aria-label="How it felt">
          {WORDS.map((w) => (
            <button key={w} type="button" className={`moon-word${word === w ? " on" : ""}`} aria-pressed={word === w} onClick={() => pick(w)}>
              {w}
            </button>
          ))}
        </div>

        {word && (
          <>
            <p className="moon-saved">Moon saved. Add a line?</p>
            <label htmlFor="moon-note" className="select-label">
              What stayed with you? (optional)
            </label>
            <input
              id="moon-note"
              className="field moon-note"
              type="text"
              maxLength={280}
              value={note}
              onChange={(event) => changeNote(event.target.value)}
              onBlur={() => saveMoonNote(checkin.id, note).catch((e) => setError(messageOf(e)))}
            />

            <button type="button" className="moon-photo" onClick={() => fileInput.current?.click()} disabled={photoBusy}>
              <span className="moon-photo-thumb" style={photoUrl ? { backgroundImage: `url(${photoUrl})` } : undefined} aria-hidden="true" />
              <span>
                <strong>{photoBusy ? "Adding…" : photoUrl ? "Photo added" : "Add a photo from last night"}</strong>
                <span className="moon-photo-sub">{photoUrl ? "Saved with this moon" : "From your camera roll"}</span>
              </span>
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) addPhoto(file);
                event.target.value = "";
              }}
            />
          </>
        )}

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </div>
      <div className="screen-foot">
        <button type="button" className={word ? "btn btn-primary" : "btn btn-ghost"} onClick={leave}>
          {word ? "See your sky" : "Not now"}
        </button>
      </div>
    </div>
  );
}
