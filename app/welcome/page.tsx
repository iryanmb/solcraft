// Welcome (design/screens/pilot/01a). Both buttons lead to the same email-code flow;
// "I have an account" only changes the wording and hides the progress bar.

import Link from "next/link";
import SunMark from "@/components/SunMark";

export default function WelcomePage() {
  return (
    <div className="screen">
      <div className="screen-body centered">
        <span className="rise sun-glow" style={{ display: "inline-block", width: 132 }}>
          <SunMark size={132} />
        </span>
        <h1 className="screen-title big">Find the rooms you&apos;ll want to come back to.</h1>
        <p className="screen-sub">Poetry, jazz, comedy and more, across Atlanta.</p>
      </div>
      <div className="screen-foot">
        <Link href="/signin" className="btn btn-primary">
          Get started
        </Link>
        <Link href="/signin?returning=1" className="btn btn-ghost">
          I have an account
        </Link>
      </div>
    </div>
  );
}
