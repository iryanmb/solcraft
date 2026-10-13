"use client";

// A stand-in for screens built in later checkpoints (inside the nav, so already signed in).

import { useRouter } from "next/navigation";
import { useProfile } from "@/components/AppShell";
import { signOut } from "@/lib/store";

type ComingSoonProps = { title: string; checkpoint: number };

export default function ComingSoon({ title, checkpoint }: ComingSoonProps) {
  const router = useRouter();
  const profile = useProfile();

  return (
    <div className="app-page">
      <h1 className="page-title">{title}</h1>
      <p className="screen-sub">xxx: arrives in checkpoint {checkpoint}.</p>
      <p className="screen-sub">
        Signed in as {profile.display_name} · {profile.sun_sign}
      </p>
      {/* xxx: Sign out moves to Settings in checkpoint 6. */}
      <button
        type="button"
        className="btn btn-ghost"
        style={{ width: "auto", marginTop: 24, padding: "0 24px", border: "1.5px solid var(--color-border)" }}
        onClick={async () => {
          await signOut().catch(() => {});
          router.replace("/welcome");
        }}
      >
        Sign out
      </button>
    </div>
  );
}
