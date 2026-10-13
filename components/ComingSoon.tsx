"use client";

// A stand-in for screens built in later checkpoints. Signed-out visitors go to Welcome.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/store";
import { useAccount } from "@/lib/useAccount";

type ComingSoonProps = { title: string; checkpoint: number };

export default function ComingSoon({ title, checkpoint }: ComingSoonProps) {
  const router = useRouter();
  const account = useAccount();

  useEffect(() => {
    if (account === null) router.replace("/welcome");
    else if (account && !account.profile) router.replace("/onboarding");
  }, [account, router]);

  if (!account?.profile) return <div className="screen" aria-busy="true" />;

  return (
    <div className="screen">
      <div className="screen-body">
        <h1 className="screen-title">{title}</h1>
        <p className="screen-sub">xxx: arrives in checkpoint {checkpoint}.</p>
        <p className="screen-sub">
          Signed in as {account.profile.display_name} · {account.profile.sun_sign}
        </p>
      </div>
      <div className="screen-foot">
        {/* xxx: Sign out moves to Settings in checkpoint 6. */}
        <button
          type="button"
          className="btn btn-ghost"
          onClick={async () => {
            await signOut().catch(() => {});
            router.replace("/welcome");
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
