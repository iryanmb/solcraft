"use client";

// The dev panel (testers only): a small "Dev" button above the nav that opens switches for
// testing away from venues. The database only honors them for tester accounts.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setDevSetting, useDevSettings, type DevSettings } from "@/lib/dev";
import { devDeleteMyCheckins, StoreError } from "@/lib/store";

const SWITCHES: { name: keyof DevSettings; label: string }[] = [
  { name: "pretendPlace", label: "Pretend I'm there (skip location)" },
  { name: "pretendTime", label: "Pretend it's session time (any session this week)" },
  { name: "moonNow", label: "Show the moon now" },
];

export default function DevPanel() {
  const router = useRouter();
  const settings = useDevSettings(true); // only rendered for testers
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  return (
    <div className="dev-panel">
      {open && (
        <div className="dev-sheet" role="dialog" aria-label="Dev panel">
          {SWITCHES.map(({ name, label }) => (
            <label key={name} className="dev-switch">
              <input type="checkbox" checked={settings[name]} onChange={(event) => setDevSetting(name, event.target.checked)} />
              {label}
            </label>
          ))}
          <button
            type="button"
            className="btn btn-ghost dev-delete"
            onClick={async () => {
              if (!window.confirm("Delete all your check-ins, moons and moon photos?")) return;
              try {
                const count = await devDeleteMyCheckins();
                setMessage(`Deleted ${count} check-in${count === 1 ? "" : "s"}.`);
                router.refresh();
              } catch (e) {
                setMessage(e instanceof StoreError ? e.message : "Couldn't delete. Try again.");
              }
            }}
          >
            Delete my check-ins
          </button>
          {message && <p className="dev-message">{message}</p>}
        </div>
      )}
      <button type="button" className="dev-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
        Dev
      </button>
    </div>
  );
}
