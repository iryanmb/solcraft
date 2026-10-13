"use client";

// Welcome back (design/screens/pilot/01g): after a returning person enters their code.

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SunMark from "@/components/SunMark";
import { useAccount } from "@/lib/useAccount";

export default function WelcomeBackPage() {
  const router = useRouter();
  const account = useAccount();

  useEffect(() => {
    if (account === null) router.replace("/welcome");
    else if (account && !account.profile) router.replace("/onboarding");
  }, [account, router]);

  if (!account?.profile) return <div className="screen" aria-busy="true" />;

  return (
    <div className="screen">
      <div className="screen-body centered" style={{ gap: 22 }}>
        <span className="rise sun-glow" style={{ display: "inline-block", width: 96 }}>
          <SunMark size={96} />
        </span>
        <h1 className="screen-title">Welcome back, {account.profile.display_name}.</h1>
        <p className="screen-sub">Your sky is right where you left it.</p>
      </div>
      <div className="screen-foot">
        <Link href="/sky" className="btn btn-primary">
          Open your sky
        </Link>
      </div>
    </div>
  );
}
