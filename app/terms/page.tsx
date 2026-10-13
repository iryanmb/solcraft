// Terms. xxx: written before the pilot.
import Link from "next/link";

export default function TermsPage() {
  return (
    <article className="page">
      <h1>Terms</h1>
      <p>xxx</p>
      <p>
        <Link href="/privacy">Privacy Policy</Link> · <Link href="/credits">Credits</Link>
      </p>
    </article>
  );
}
