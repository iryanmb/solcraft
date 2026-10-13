"use client";

// Settings (design/screens/pilot/08; CLAUDE.md: account name, email, birthday; privacy policy;
// terms; sign out; delete account). Left out from the mockup: Photo, Instagram, Notifications.

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BirthdayFields, { fromIso, isAdult, isComplete, toIso, type BirthdayParts } from "@/components/BirthdayFields";
import { useShell } from "@/components/AppShell";
import { deleteMyAccount, signOut, StoreError, updateProfile } from "@/lib/store";

const messageOf = (e: unknown) => (e instanceof StoreError ? e.message : "Something went wrong. Try again.");

// "2004-08-14" -> "Aug 14, 2004" (a calendar date, so no time zone shift)
const birthdayText = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric" }).format(new Date(`${iso}T00:00:00Z`));

export default function SettingsPage() {
  const router = useRouter();
  const { profile, email, setProfile } = useShell();
  const [editing, setEditing] = useState<"name" | "birthday" | null>(null);
  const [name, setName] = useState(profile.display_name);
  const [birthday, setBirthday] = useState<BirthdayParts>(fromIso(profile.birthday));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save(changes: { displayName?: string; birthday?: string }) {
    setBusy(true);
    setError("");
    try {
      setProfile(await updateProfile(changes));
      setEditing(null);
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setBusy(false);
    }
  }

  function cancel() {
    setEditing(null);
    setError("");
    setName(profile.display_name);
    setBirthday(fromIso(profile.birthday));
  }

  const tooYoung = isComplete(birthday) && !isAdult(birthday);

  return (
    <div className="app-page settings">
      <h1 className="page-title">Settings</h1>

      <section className="settings-group" aria-labelledby="account-heading">
        <h2 id="account-heading" className="section-title">
          Account
        </h2>
        <div className="settings-card">
          <div className="settings-row">
            <span className="settings-label">Name</span>
            {editing === "name" ? (
              <form
                className="settings-edit"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (name.trim()) save({ displayName: name });
                }}
              >
                <label htmlFor="settings-name" className="visually-hidden">
                  Name
                </label>
                <input id="settings-name" className="field" value={name} maxLength={50} autoComplete="given-name" onChange={(e) => setName(e.target.value)} autoFocus />
                <div className="settings-actions">
                  <button type="button" className="text-button muted-button" onClick={cancel}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary settings-save" disabled={!name.trim() || busy}>
                    Save
                  </button>
                </div>
              </form>
            ) : (
              <button type="button" className="settings-value" onClick={() => setEditing("name")}>
                {profile.display_name} <span aria-hidden="true">›</span>
              </button>
            )}
          </div>

          <div className="settings-row">
            <span className="settings-label">Email</span>
            {/* xxx: changing your email comes with the domain (Resend can only reach your own address until then). */}
            <span className="settings-value static">{email}</span>
          </div>

          <div className="settings-row">
            <span className="settings-label">Birthday</span>
            {editing === "birthday" ? (
              <form
                className="settings-edit"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (isComplete(birthday) && !tooYoung) save({ birthday: toIso(birthday) });
                }}
              >
                <BirthdayFields value={birthday} onChange={setBirthday} />
                {tooYoung && (
                  <p className="error" role="alert">
                    Solcraft is for people 18 and older.
                  </p>
                )}
                <div className="settings-actions">
                  <button type="button" className="text-button muted-button" onClick={cancel}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary settings-save" disabled={!isComplete(birthday) || tooYoung || busy}>
                    Save
                  </button>
                </div>
              </form>
            ) : (
              <button type="button" className="settings-value" onClick={() => setEditing("birthday")}>
                {birthdayText(profile.birthday)} · {profile.sun_sign} <span aria-hidden="true">›</span>
              </button>
            )}
          </div>
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </section>

      <section className="settings-group" aria-labelledby="about-heading">
        <h2 id="about-heading" className="section-title">
          About
        </h2>
        <div className="settings-card">
          <Link href="/terms" className="settings-row settings-link">
            Terms <span aria-hidden="true">›</span>
          </Link>
          <Link href="/privacy" className="settings-row settings-link">
            Privacy Policy <span aria-hidden="true">›</span>
          </Link>
          <Link href="/credits" className="settings-row settings-link">
            Credits <span aria-hidden="true">›</span>
          </Link>
        </div>
      </section>

      <div className="settings-group settings-bottom">
        <button
          type="button"
          className="btn btn-ghost settings-signout"
          onClick={async () => {
            await signOut().catch(() => {});
            router.replace("/welcome");
          }}
        >
          Sign out
        </button>

        {confirmDelete ? (
          <div className="delete-confirm" role="alertdialog" aria-labelledby="delete-heading">
            <h2 id="delete-heading" className="panel-title">
              Delete your account?
            </h2>
            <p className="screen-sub">Your sky, check-ins, moons and photos are deleted for good.</p>
            <div className="settings-actions">
              <button type="button" className="text-button muted-button" onClick={() => setConfirmDelete(false)} disabled={busy}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  setError("");
                  try {
                    await deleteMyAccount();
                    router.replace("/welcome");
                  } catch (e) {
                    setError(messageOf(e));
                    setBusy(false);
                  }
                }}
              >
                {busy ? "Deleting…" : "Delete for good"}
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="text-button delete-link" onClick={() => setConfirmDelete(true)}>
            Delete account
          </button>
        )}
      </div>
    </div>
  );
}
