"use client";

// "/" shows nothing itself. It checks who you are and sends you on:
// signed out -> Welcome; signed in, onboarding not finished -> onboarding; otherwise -> Your Sky.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "@/lib/useAccount";

export default function Home() {
  const account = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (account === undefined) return; // still checking
    if (account === null) router.replace("/welcome");
    else if (!account.profile) router.replace("/onboarding");
    else router.replace("/sky");
  }, [account, router]);

  return <div className="screen" aria-busy="true" />;
}
