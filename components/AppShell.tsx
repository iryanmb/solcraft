"use client";

// The frame around every signed-in screen: a bottom bar on phones, a sidebar on wide
// screens. It also checks the account once and shares the profile with the screen inside.
// Signed out -> Welcome; onboarding not finished -> onboarding.

import { createContext, useContext, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import SunMark from "@/components/SunMark";
import type { Profile } from "@/lib/store";
import { useAccount } from "@/lib/useAccount";

const ProfileContext = createContext<Profile | null>(null);

// For screens inside the shell: the signed-in person's profile (always there inside it).
export function useProfile(): Profile {
  const profile = useContext(ProfileContext);
  if (!profile) throw new Error("useProfile() is only for screens inside AppShell.");
  return profile;
}

const icons = {
  discover: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </>
  ),
  here: (
    <>
      <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  sky: (
    <>
      <circle cx="12" cy="12" r="4" />
      <ellipse cx="12" cy="12" rx="10" ry="4.5" />
    </>
  ),
  road: (
    <>
      <path d="M8 21c0-6 8-6 8-12M8 9c0-3 2-6 4-6" />
      <circle cx="16" cy="9" r="2" />
    </>
  ),
};

const Icon = ({ name, size = 24 }: { name: keyof typeof icons; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {icons[name]}
  </svg>
);

// The pilot's four places (CLAUDE.md): Discover · I'm here (center) · Your Sky · Sun Road.
const PLACES = [
  { href: "/discover", label: "Discover", icon: "discover" },
  { href: "/here", label: "I'm here", icon: "here" },
  { href: "/sky", label: "Your Sky", icon: "sky" },
  { href: "/sun-road", label: "Sun Road", icon: "road" },
] as const;

// The sidebar (wide screens) and the bottom bar (phones). Only one shows at a time (CSS).
export function AppNav({ name }: { name: string }) {
  const pathname = usePathname();
  const current = (href: string) => (pathname.startsWith(href) ? "page" : undefined);

  return (
    <>
      <aside className="sidebar">
        <Link href="/discover" className="brand">
          <SunMark size={36} strokeWidth={4} />
          Solcraft
        </Link>
        <nav aria-label="Main">
          {PLACES.map((place) => (
            <Link key={place.href} href={place.href} className="side-link" aria-current={current(place.href)}>
              <Icon name={place.icon} size={20} />
              {place.label}
            </Link>
          ))}
        </nav>
        <p className="side-user">
          <span className="side-avatar" aria-hidden="true">
            <SunMark size={24} strokeWidth={5} />
          </span>
          {name}
        </p>
      </aside>

      <nav className="bottom-nav" aria-label="Main">
        {PLACES.map((place) =>
          place.icon === "here" ? (
            <Link key={place.href} href={place.href} className="here-button" aria-label={place.label} aria-current={current(place.href)}>
              <Icon name="here" size={26} />
            </Link>
          ) : (
            <Link key={place.href} href={place.href} className="tab" aria-current={current(place.href)}>
              <Icon name={place.icon} />
              {place.label}
            </Link>
          ),
        )}
      </nav>
    </>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const account = useAccount();

  useEffect(() => {
    if (account === null) router.replace("/welcome");
    else if (account && !account.profile) router.replace("/onboarding");
  }, [account, router]);

  if (!account?.profile) return <div className="screen" aria-busy="true" />;

  return (
    <ProfileContext.Provider value={account.profile}>
      <div className="app">
        <AppNav name={account.profile.display_name} />
        <div className="app-main">{children}</div>
      </div>
    </ProfileContext.Provider>
  );
}
