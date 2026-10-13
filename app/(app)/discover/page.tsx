"use client";

// Discover (design/screens/pilot/02a phone, 02b web): every gathering as a card, with
// This week (Monday to Sunday, Atlanta time) / Under $20 / All and their counts.

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import GatheringCard from "@/components/GatheringCard";
import type { MapPin } from "@/components/VenueMap";
import { isUnderTwenty } from "@/lib/gatherings";
import { getDiscover, StoreError, type DiscoverGathering, type Session } from "@/lib/store";
import { thisWeekInAtlanta } from "@/lib/time";

// The map (MapLibre, a large library) loads only when someone opens it, and only in the browser.
const VenueMap = dynamic(() => import("@/components/VenueMap"), {
  ssr: false,
  loading: () => <div className="map-box" aria-busy="true" />,
});

type Filter = "week" | "under20" | "all";
const FILTERS: { key: Filter; label: string; eyebrow: string }[] = [
  { key: "week", label: "This week", eyebrow: "this week" },
  { key: "under20", label: "Under $20", eyebrow: "under $20" },
  { key: "all", label: "All", eyebrow: "everything" },
];

export default function DiscoverPage() {
  const [gatherings, setGatherings] = useState<DiscoverGathering[] | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("week");
  const [openId, setOpenId] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0); // bumping it reloads
  const [showMap, setShowMap] = useState(false);
  const [venueId, setVenueId] = useState<string | null>(null); // a tapped map pin

  useEffect(() => {
    let current = true;
    getDiscover()
      .then((data) => current && setGatherings(data))
      .catch((e) => current && setError(e instanceof StoreError ? e.message : "Couldn't load gatherings. Try again."));
    return () => {
      current = false;
    };
  }, [attempt]);

  // For each filter: which gatherings show, and which session each card headlines.
  const lists = useMemo(() => {
    const week = thisWeekInAtlanta();
    const byNext = (items: { gathering: DiscoverGathering; session?: Session }[]) =>
      items.sort((a, b) => {
        if (!a.session || !b.session) return a.session ? -1 : b.session ? 1 : a.gathering.title.localeCompare(b.gathering.title);
        return a.session.startsAt.getTime() - b.session.startsAt.getTime();
      });
    const all = gatherings ?? [];
    return {
      week: byNext(
        all
          .map((gathering) => ({ gathering, session: gathering.upcoming.find((s) => s.startsAt < week.end) }))
          .filter((item) => item.session),
      ),
      under20: byNext(all.filter((g) => isUnderTwenty(g.costText) === true).map((gathering) => ({ gathering, session: gathering.upcoming[0] }))),
      all: byNext(all.map((gathering) => ({ gathering, session: gathering.upcoming[0] }))),
      unknownPrice: all.filter((g) => isUnderTwenty(g.costText) === null).length,
    };
  }, [gatherings]);

  const inFilter = lists[filter];
  const shown = venueId ? inFilter.filter((item) => item.gathering.venue.id === venueId) : inFilter;
  const eyebrow = FILTERS.find((f) => f.key === filter)!.eyebrow;

  // One pin per venue in the current filter. Venues without coordinates (xxx) get none.
  const pins = useMemo(() => {
    const byVenue = new Map<string, MapPin>();
    for (const { gathering } of inFilter) {
      const { id, name, lat, lng } = gathering.venue;
      if (lat === null || lng === null) continue;
      const pin = byVenue.get(id);
      if (pin) pin.count++;
      else byVenue.set(id, { id, name, lat, lng, count: 1 });
    }
    return [...byVenue.values()];
  }, [inFilter]);

  function pickVenue(id: string) {
    setVenueId(id);
    const atVenue = inFilter.filter((item) => item.gathering.venue.id === id);
    setOpenId(atVenue.length === 1 ? atVenue[0].gathering.id : null);
  }

  return (
    <div className="app-page">
      <header className="discover-head">
        <div>
          <p className="eyebrow">Atlanta · {eyebrow}</p>
          <h1 className="page-title">Where to shine</h1>
        </div>
        <div className="chips" role="group" aria-label="Show">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              className={`chip${filter === f.key ? " on" : ""}`}
              aria-pressed={filter === f.key}
              onClick={() => {
                setFilter(f.key);
                setOpenId(null);
                setVenueId(null);
              }}
            >
              {f.label}
              {gatherings && <span className="chip-count">{lists[f.key].length}</span>}
            </button>
          ))}
          <button
            type="button"
            className="chip map-toggle"
            aria-pressed={showMap}
            onClick={() => {
              setShowMap(!showMap);
              setVenueId(null);
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
              <path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" />
              <path d="M9 4v14M15 6v14" />
            </svg>
            {showMap ? "List only" : "Map"}
          </button>
        </div>
      </header>

      {filter === "under20" && lists.unknownPrice > 0 && <p className="list-note">{lists.unknownPrice} more with price xxx.</p>}

      {error ? (
        <div className="list-message">
          <p role="alert">{error}</p>
          <button
            type="button"
            className="btn btn-primary"
            style={{ width: "auto", padding: "0 24px" }}
            onClick={() => {
              setError("");
              setAttempt((n) => n + 1);
            }}
          >
            Try again
          </button>
        </div>
      ) : !gatherings ? (
        <p className="list-message" aria-busy="true">
          Loading…
        </p>
      ) : (
        <div className={showMap ? "discover-body with-map" : "discover-body"}>
          {showMap && (
            <div className="map-column">
              <VenueMap pins={pins} selectedId={venueId} onSelect={pickVenue} />
            </div>
          )}
          <div className="card-list">
            {venueId && (
              <p className="venue-bar">
                At {shown[0]?.gathering.venue.name}
                <button type="button" className="text-button" onClick={() => setVenueId(null)}>
                  Show all
                </button>
              </p>
            )}
            {shown.length === 0 && <p className="list-message">Nothing here yet.</p>}
            {shown.map(({ gathering, session }) => (
              <GatheringCard
                key={gathering.id}
                gathering={gathering}
                session={session}
                open={openId === gathering.id}
                onToggle={() => setOpenId(openId === gathering.id ? null : gathering.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
