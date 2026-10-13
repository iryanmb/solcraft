// Sign-in page. The form reads "?returning=1" from the address, which Next.js can only
// do in the browser, so it sits inside <Suspense> (see Next's useSearchParams docs).

import { Suspense } from "react";
import SignInForm from "./SignInForm";

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="screen" aria-busy="true" />}>
      <SignInForm />
    </Suspense>
  );
}
