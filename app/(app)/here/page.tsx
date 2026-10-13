"use client";

// I'm here (the center button): gatherings whose check-in window is open right now.
// Nothing open -> "Nothing on right now" and the rest of this week's sessions.

import { useEffect, useMemo, useState } from "react";
import { useProfile } from "@/components/AppShell";
import ImHereButton from "@/components/ImHereButton";
import { useDevSettings } from "@/lib/dev";
import { cityOf } from "@/lib/gatherings";
import { getDiscover, StoreError, type DiscoverGathering, type Session } from "@/lib/store";
import { sessionText, thisWeekInAtlanta } from "@/lib/time";

type Item = { gathering: DiscoverGathering; session: Session };

export default function HerePage() {
  const profile = useProfile();
  const dev = useDevSettings(profile.is_tester);
  const [gatherings, setGatherings] = useState<DiscoverGathering[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let current = true;
    getDiscover()
      .then((data) => current && setGatherings(data))
      .catch((e) => current && setError(e instanceof StoreError ? e.message : "Couldn't load gatherings. Try again."));
    return () => {
      current = false;
    };
  }, []);

  const { open, later } = useMemo(() => {
    const now = new Date();
    const week = thisWeekInAtlanta(now);
    const all: Item[] = (gatherings ?? [])
      .flatMap((gathering) => gathering.upcoming.map((session) => ({ gathering, session })))
      .sort((a, b) => a.session.startsAt.getTime() - b.session.startsAt.getTime());
    const isOpen = (s: Session) => s.opensAt <= now && now <= s.closesAt;
    return {
      // "Pretend it's session time" (testers): every session this week counts as open.
      open: all.filter(({ session }) => (dev.pretendTime ? session.startsAt < week.end : isOpen(session))),
      later: all.filter(({ session }) => !isOpen(session) && session.startsAt > now && session.startsAt < week.end).slice(0, 5),
    };
  }, [gatherings, dev.pretendTime]);

  return (
    <div className="app-page">
      <p className="eyebrow">Atlanta · right now</p>
      <h1 className="page-title">I&apos;m here</h1>

      {error ? (
        <p className="list-message" role="alert">
          {error}
        </p>
      ) : !gatherings ? (
        <p className="list-message" aria-busy="true">
          Loading…
        </p>
      ) : open.length > 0 ? (
        <div className="card-list here-list">
          {open.map(({ gathering, session }) => (
            <article key={session.id} className="card here-card">
              <span className="card-when">{sessionText(session.startsAt, session.endsAt)}</span>
              <h2 className="card-title">{gathering.title}</h2>
              <span className="card-meta">
                {gathering.venue.name} · {cityOf(gathering.venue.address)}
              </span>
              {/* Castleberry Hill and any place without coordinates: no check-in (DECISIONS.md). */}
              {gathering.venue.lat === null && !dev.pretendPlace ? (
                <p className="card-line muted">Not on the map yet, so no check-in here.</p>
              ) : (
                <ImHereButton sessionId={session.id} />
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="here-empty">
          <p className="screen-sub">Nothing on right now.</p>
          {later.length > 0 && (
            <>
              <h2 className="section-title">Next this week</h2>
              <ul className="next-list">
                {later.map(({ gathering, session }) => (
                  <li key={session.id}>
                    <span className="card-when">{sessionText(session.startsAt, session.endsAt)}</span>
                    <span className="next-title">{gathering.title}</span>
                    <span className="card-meta">{gathering.venue.name}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
