"use client";

// Email -> sign-in code (design/screens/pilot/01b, 01c). The same flow signs up new people
// and signs in returning ones; whether a profile exists decides where it goes next.

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import CodeInput from "@/components/CodeInput";
import ScreenTop from "@/components/ScreenTop";
import { CODE_LENGTH } from "@/lib/config";
import { getAccount, sendCode, StoreError, verifyCode } from "@/lib/store";

const RESEND_WAIT_SECONDS = 60; // Supabase allows one code per address per minute
const looksLikeEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const messageOf = (error: unknown) => (error instanceof StoreError ? error.message : "Something went wrong. Try again.");

export default function SignInForm() {
  const router = useRouter();
  const returning = useSearchParams().get("returning") === "1";

  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [waitUntil, setWaitUntil] = useState(0); // when "Send a new code" works again
  const [now, setNow] = useState(() => Date.now());

  // Tick once a second while the resend wait is running.
  useEffect(() => {
    if (waitUntil <= now) return;
    const timer = setTimeout(() => setNow(Date.now()), 1000);
    return () => clearTimeout(timer);
  }, [waitUntil, now]);
  const secondsLeft = Math.max(0, Math.ceil((waitUntil - now) / 1000));

  async function requestCode() {
    setBusy(true);
    setError("");
    try {
      await sendCode(email);
      setCode("");
      setStep("code");
      setWaitUntil(Date.now() + RESEND_WAIT_SECONDS * 1000);
      setNow(Date.now());
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setBusy(false);
    }
  }

  async function onSubmitEmail(event: FormEvent) {
    event.preventDefault();
    if (looksLikeEmail(email) && !busy) await requestCode();
  }

  async function onSubmitCode(event: FormEvent) {
    event.preventDefault();
    if (code.length !== CODE_LENGTH || busy) return;
    setBusy(true);
    setError("");
    try {
      await verifyCode(email, code);
      const account = await getAccount();
      router.replace(account?.profile ? "/welcome-back" : "/onboarding");
    } catch (e) {
      setError(messageOf(e));
      setBusy(false);
    }
  }

  function back() {
    setError("");
    if (step === "code") setStep("email");
    else router.push("/welcome");
  }

  if (step === "email") {
    return (
      <form className="screen" onSubmit={onSubmitEmail} noValidate>
        <ScreenTop onBack={back} step={returning ? undefined : 1} />
        <div className="screen-body">
          <h1 className="screen-title">{returning ? "Welcome back. Your email?" : "What's your email?"}</h1>
          <p className="screen-sub">We&apos;ll email you a code. No passwords.</p>
          <label htmlFor="email" className="visually-hidden">
            Email
          </label>
          <input
            id="email"
            className="field"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="you@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value.trim().toLowerCase())}
            autoFocus
          />
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </div>
        <div className="screen-foot">
          <p className="fine-print">
            By continuing you agree to the <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.
          </p>
          <button type="submit" className="btn btn-primary" disabled={!looksLikeEmail(email) || busy}>
            {busy ? "Sending…" : "Send code"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form className="screen" onSubmit={onSubmitCode} noValidate>
      <ScreenTop onBack={back} step={returning ? undefined : 2} />
      <div className="screen-body">
        <h1 className="screen-title">Enter the code</h1>
        <p className="screen-sub">
          Sent to {email}.{" "}
          <button type="button" className="text-button" onClick={back}>
            Edit
          </button>
        </p>
        <CodeInput value={code} onChange={setCode} />
        <button type="button" className="link-button" onClick={requestCode} disabled={secondsLeft > 0 || busy}>
          {secondsLeft > 0 ? `Send a new code in ${secondsLeft}s` : "Send a new code"}
        </button>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </div>
      <div className="screen-foot">
        <button type="submit" className="btn btn-primary" disabled={code.length !== CODE_LENGTH || busy}>
          {busy ? "Checking…" : "Continue"}
        </button>
      </div>
    </form>
  );
}
