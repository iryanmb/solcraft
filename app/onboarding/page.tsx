"use client";

// Name -> birthday -> constellation reveal (design/screens/pilot/01d, 01e, 01f).
// Nothing is saved until Continue on the birthday step; then the profile is created and
// the database returns the sun sign the reveal shows.

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Constellation from "@/components/Constellation";
import ScreenTop from "@/components/ScreenTop";
import { createProfile, signOut, StoreError, type Profile } from "@/lib/store";
import { useAccount } from "@/lib/useAccount";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const THIS_YEAR = new Date().getFullYear();
// Includes years under 18, so a younger person sees why they can't continue.
const YEARS = Array.from({ length: 90 }, (_, i) => THIS_YEAR - 10 - i);

const pad = (n: number) => String(n).padStart(2, "0");
const daysIn = (month: number, year: number) => new Date(year || 2000, month, 0).getDate(); // 2000: a leap year, so Feb 29 is allowed until a year is chosen

// 18 or older today, on this device's calendar. The database checks again when saving.
function isAdult(year: number, month: number, day: number) {
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  return `${year + 18}-${pad(month)}-${pad(day)}` <= todayIso;
}

export default function OnboardingPage() {
  const router = useRouter();
  const account = useAccount();

  const [step, setStep] = useState<"name" | "birthday" | "reveal">("name");
  const [name, setName] = useState("");
  const [month, setMonth] = useState(0); // 0 = not chosen yet
  const [day, setDay] = useState(0);
  const [year, setYear] = useState(0);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Signed out -> Welcome. Already onboarded -> Your Sky.
  useEffect(() => {
    if (account === null) router.replace("/welcome");
    else if (account?.profile) router.replace("/sky");
  }, [account, router]);

  if (!account || (account.profile && step !== "reveal")) return <div className="screen" aria-busy="true" />;

  const complete = month > 0 && day > 0 && year > 0;
  const tooYoung = complete && !isAdult(year, month, day);

  async function onSubmitBirthday(event: FormEvent) {
    event.preventDefault();
    if (!complete || tooYoung || busy) return;
    setBusy(true);
    setError("");
    try {
      setProfile(await createProfile(name, `${year}-${pad(month)}-${pad(day)}`));
      setStep("reveal");
    } catch (e) {
      setError(e instanceof StoreError ? e.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (step === "name") {
    return (
      <form
        className="screen"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (name.trim()) setStep("birthday");
        }}
      >
        {/* Back from here means "wrong email": sign out and start the email step again. */}
        <ScreenTop
          step={3}
          onBack={async () => {
            await signOut().catch(() => {});
            router.replace("/signin");
          }}
        />
        <div className="screen-body">
          <h1 className="screen-title">What should we call you?</h1>
          <p className="screen-sub">Your first name is fine.</p>
          <label htmlFor="name" className="visually-hidden">
            Name
          </label>
          <input
            id="name"
            className="field"
            type="text"
            autoComplete="given-name"
            maxLength={50}
            placeholder="Your name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoFocus
          />
        </div>
        <div className="screen-foot">
          <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
            Continue
          </button>
        </div>
      </form>
    );
  }

  if (step === "birthday") {
    const dayCount = daysIn(month || 1, year);
    return (
      <form className="screen" onSubmit={onSubmitBirthday} noValidate>
        <ScreenTop step={4} onBack={() => setStep("name")} />
        <div className="screen-body">
          <h1 className="screen-title">When&apos;s your birthday?</h1>
          <p className="screen-sub">It draws the first stars in your sky.</p>
          <div className="select-row">
            <label className="select-label">
              Month
              <select
                className="field"
                value={month}
                onChange={(event) => {
                  const m = Number(event.target.value);
                  setMonth(m);
                  if (day > daysIn(m, year)) setDay(0);
                }}
              >
                <option value={0} disabled>
                  —
                </option>
                {MONTHS.map((label, i) => (
                  <option key={label} value={i + 1}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="select-label">
              Day
              <select className="field" value={day} onChange={(event) => setDay(Number(event.target.value))}>
                <option value={0} disabled>
                  —
                </option>
                {Array.from({ length: dayCount }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </label>
            <label className="select-label">
              Year
              <select
                className="field"
                value={year}
                onChange={(event) => {
                  const y = Number(event.target.value);
                  setYear(y);
                  if (month && day > daysIn(month, y)) setDay(0);
                }}
              >
                <option value={0} disabled>
                  —
                </option>
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {(tooYoung || error) && (
            <p className="error" role="alert">
              {tooYoung ? "Solcraft is for people 18 and older." : error}
            </p>
          )}
        </div>
        <div className="screen-foot">
          <button type="submit" className="btn btn-primary" disabled={!complete || tooYoung || busy}>
            {busy ? "Saving…" : "Continue"}
          </button>
        </div>
      </form>
    );
  }

  // The reveal. The sign comes from the database (profiles.sun_sign), not from the browser.
  const sign = profile?.sun_sign ?? "";
  return (
    <div className="screen">
      <div className="screen-body centered" style={{ alignItems: "center", textAlign: "center", gap: 30 }}>
        <Constellation sign={sign} animate />
        <h1 className="screen-title late">
          Your sky begins with {sign}, {profile?.display_name}.
        </h1>
      </div>
      <div className="screen-foot">
        <Link href="/discover" className="btn btn-primary late">
          See what&apos;s on
        </Link>
      </div>
    </div>
  );
}
