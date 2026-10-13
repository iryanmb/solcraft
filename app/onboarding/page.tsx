"use client";

// Name -> birthday -> constellation reveal (design/screens/pilot/01d, 01e, 01f).
// Nothing is saved until Continue on the birthday step; then the profile is created and
// the database returns the sun sign the reveal shows.

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BirthdayFields, { isAdult, isComplete, toIso, type BirthdayParts } from "@/components/BirthdayFields";
import Constellation from "@/components/Constellation";
import ScreenTop from "@/components/ScreenTop";
import { createProfile, signOut, StoreError, type Profile } from "@/lib/store";
import { useAccount } from "@/lib/useAccount";

export default function OnboardingPage() {
  const router = useRouter();
  const account = useAccount();

  const [step, setStep] = useState<"name" | "birthday" | "reveal">("name");
  const [name, setName] = useState("");
  const [birthday, setBirthday] = useState<BirthdayParts>({ month: 0, day: 0, year: 0 });
  const [profile, setProfile] = useState<Profile | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Signed out -> Welcome. Already onboarded -> Your Sky.
  useEffect(() => {
    if (account === null) router.replace("/welcome");
    else if (account?.profile) router.replace("/sky");
  }, [account, router]);

  if (!account || (account.profile && step !== "reveal")) return <div className="screen" aria-busy="true" />;

  const complete = isComplete(birthday);
  const tooYoung = complete && !isAdult(birthday);

  async function onSubmitBirthday(event: FormEvent) {
    event.preventDefault();
    if (!complete || tooYoung || busy) return;
    setBusy(true);
    setError("");
    try {
      setProfile(await createProfile(name, toIso(birthday)));
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
    return (
      <form className="screen" onSubmit={onSubmitBirthday} noValidate>
        <ScreenTop step={4} onBack={() => setStep("name")} />
        <div className="screen-body">
          <h1 className="screen-title">When&apos;s your birthday?</h1>
          <p className="screen-sub">It draws the first stars in your sky.</p>
          <BirthdayFields value={birthday} onChange={setBirthday} />
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
