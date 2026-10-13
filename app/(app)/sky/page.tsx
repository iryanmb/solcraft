"use client";

// Your Sky (design/screens/pilot/05a–05d): Sky and Moons tabs. The sun count opens the Sun Road.
// Tap a sun for its planets; otherwise the panel shows "Back this week".

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useProfile } from "@/components/AppShell";
import SkyMap, { type SkySun } from "@/components/SkyMap";
import SunMark from "@/components/SunMark";
import { getDiscover, getMoonPhotoUrls, getMyCheckins, StoreError, type DiscoverGathering, type MyCheckin } from "@/lib/store";
import { sessionText, shortDayText, thisWeekInAtlanta } from "@/lib/time";

type Data = { checkins: MyCheckin[]; gatherings: Map<string, DiscoverGathering> };

export default function SkyPage() {
  const profile = useProfile();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"sky" | "moons">("sky");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<Record<string, string>>({});

  useEffect(() => {
    let current = true;
    Promise.all([getMyCheckins(), getDiscover()])
      .then(([checkins, gatherings]) => {
        if (current) setData({ checkins, gatherings: new Map(gatherings.map((g) => [g.id, g])) });
      })
      .catch((e) => current && setError(e instanceof StoreError ? e.message : "Couldn't load your sky. Try again."));
    return () => {
      current = false;
    };
  }, []);

  // Suns in the order you found them; each with its nights (planets) in order.
  const suns = useMemo<SkySun[]>(() => {
    const byGathering = new Map<string, SkySun>();
    for (const c of data?.checkins ?? []) {
      if (c.kind !== "recurring") continue; // one-time events would be comets (none yet)
      const sun = byGathering.get(c.gatheringId) ?? { gatheringId: c.gatheringId, title: c.title, artForm: c.artForm, planets: [] };
      sun.planets.push({ checkinId: c.id, hasMoon: !!c.moon });
      byGathering.set(c.gatheringId, sun);
    }
    return [...byGathering.values()];
  }, [data]);

  const moons = useMemo(() => (data?.checkins ?? []).filter((c) => c.moon).reverse(), [data]);

  // Load the moon photos' private links once the Moons tab is opened.
  useEffect(() => {
    if (tab !== "moons") return;
    const paths = moons.map((c) => c.moon?.photoPath).filter((p): p is string => !!p && !photos[p]);
    if (paths.length) getMoonPhotoUrls(paths).then((urls) => setPhotos((old) => ({ ...old, ...urls })));
  }, [tab, moons, photos]);

  if (error) return <div className="app-page"><p className="list-message" role="alert">{error}</p></div>;
  if (!data) return <div className="app-page"><p className="list-message" aria-busy="true">Loading…</p></div>;

  const week = thisWeekInAtlanta();
  const now = new Date();
  // Each of your suns' next session this week (one row per gathering), soonest first.
  const backThisWeek = suns
    .map((sun) => ({
      sun,
      session: (data.gatherings.get(sun.gatheringId)?.upcoming ?? []).find((s) => s.startsAt < week.end && s.closesAt > now),
    }))
    .filter((item): item is { sun: SkySun; session: NonNullable<typeof item.session> } => !!item.session)
    .sort((a, b) => a.session.startsAt.getTime() - b.session.startsAt.getTime());

  const selected = suns.find((s) => s.gatheringId === selectedId);
  const selectedGathering = selected ? data.gatherings.get(selected.gatheringId) : undefined;
  const nightsAt = (gatheringId: string) => data.checkins.filter((c) => c.gatheringId === gatheringId);

  return (
    <div className="app-page">
      <header className="sky-head">
        <h1 className="page-title">Your Sky</h1>
        <div className="tabs" role="tablist" aria-label="Your Sky">
          {(["sky", "moons"] as const).map((t) => (
            <button key={t} type="button" role="tab" aria-selected={tab === t} className={`tab-button${tab === t ? " on" : ""}`} onClick={() => setTab(t)}>
              {t === "sky" ? "Sky" : "Moons"}
            </button>
          ))}
        </div>
        <span className="sky-head-end">
          <Link href="/sun-road" className="sun-count" aria-label={`${suns.length} suns. Open the Sun Road`}>
            <SunMark size={30} strokeWidth={5} />
            {suns.length}
          </Link>
          {/* Phones: Settings lives here (wide screens: your name in the sidebar). */}
          <Link href="/settings" className="gear" aria-label="Settings">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
            </svg>
          </Link>
        </span>
      </header>

      {tab === "sky" ? (
        <div className="sky-layout">
          <div className="sky-card">
            <SkyMap suns={suns} sign={profile.sun_sign ?? ""} selectedId={selectedId} onSelect={setSelectedId} />
            {suns.length === 0 && <p className="sky-empty">Your first sun appears when you check in.</p>}
          </div>

          <aside className="sky-panel">
            {selected && selectedGathering ? (
              <>
                <div className="sky-panel-top">
                  <p className="kicker">
                    {selected.artForm} · since {shortDayText(nightsAt(selected.gatheringId)[0].startsAt)}
                  </p>
                  <button type="button" className="text-button" onClick={() => setSelectedId(null)}>
                    Close
                  </button>
                </div>
                <h2 className="panel-title">{selected.title}</h2>
                <p className="card-meta">{selectedGathering.venue.name}</p>
                <ul className="planet-list">
                  {nightsAt(selected.gatheringId).map((c) => (
                    <li key={c.id}>
                      <Link href={`/planet?c=${c.id}`} className={`planet-row${c.moon ? "" : " no-moon"}`}>
                        <span>{shortDayText(c.startsAt)}</span>
                        <span>{c.moon?.word ?? "No moon"}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                {selectedGathering.upcoming[0] && (
                  <p className="card-line muted">Next: {sessionText(selectedGathering.upcoming[0].startsAt, selectedGathering.upcoming[0].endsAt)}</p>
                )}
              </>
            ) : (
              <>
                <h2 className="panel-title">Back this week</h2>
                {backThisWeek.length === 0 ? (
                  <p className="card-line muted">{suns.length ? "None of your suns meet again this week." : "Check in somewhere to start your sky."}</p>
                ) : (
                  <ul className="back-list">
                    {backThisWeek.map(({ sun, session }) => (
                      <li key={session.id}>
                        <button type="button" className="back-row" onClick={() => setSelectedId(sun.gatheringId)}>
                          <strong>{sun.title}</strong>
                          <span>{sessionText(session.startsAt, session.endsAt)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </aside>
        </div>
      ) : moons.length === 0 ? (
        <p className="list-message">No moons yet. One is offered the morning after each check-in.</p>
      ) : (
        <div className="moon-grid">
          {moons.map((c) => {
            const url = c.moon?.photoPath ? photos[c.moon.photoPath] : undefined;
            return (
              <Link key={c.id} href={`/planet?c=${c.id}`} className="moon-card">
                {c.moon?.photoPath ? (
                  <span className="moon-card-photo" style={url ? { backgroundImage: `url(${url})` } : undefined} aria-hidden="true" />
                ) : (
                  <span className="moon-card-dot" aria-hidden="true" />
                )}
                <span className="moon-card-text">
                  <span className="moon-card-top">
                    <strong>{c.moon?.word}</strong>
                    <span className="card-meta">{shortDayText(c.startsAt)}</span>
                  </span>
                  <span className="card-meta">{c.title}</span>
                  {c.moon?.note && <span className="moon-card-note">“{c.moon.note}”</span>}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
