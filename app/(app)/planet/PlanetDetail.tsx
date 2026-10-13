"use client";

// Planet detail (design/screens/pilot/06): one night, its moon, the moons around this sun,
// and the gathering's next session with Plan it. ("Saved artist" from the mockup is left
// out: there's no such data.)

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PlanItButton from "@/components/PlanItButton";
import { artFormColor, ordinal } from "@/lib/gatherings";
import { getDiscover, getMoonPhotoUrl, getMyCheckins, getVenueName, type DiscoverGathering, type MyCheckin } from "@/lib/store";
import { dayText, sessionText, shortDayText } from "@/lib/time";

type Data = { checkin: MyCheckin; nights: MyCheckin[]; venueName: string; gathering: DiscoverGathering | undefined; photoUrl: string | null };

export default function PlanetDetail() {
  const checkinId = useSearchParams().get("c");
  const [data, setData] = useState<Data | null | "missing">(null);

  useEffect(() => {
    if (!checkinId) return;
    let current = true;
    setData(null);
    Promise.all([getMyCheckins(), getDiscover()]).then(async ([all, gatherings]) => {
      const checkin = all.find((c) => c.id === checkinId);
      if (!checkin) return current && setData("missing");
      const [venueName, photoUrl] = await Promise.all([
        getVenueName(checkin.venueId),
        checkin.moon?.photoPath ? getMoonPhotoUrl(checkin.moon.photoPath) : Promise.resolve(null),
      ]);
      const gathering = gatherings.find((g) => g.id === checkin.gatheringId);
      if (current) setData({ checkin, nights: all.filter((c) => c.gatheringId === checkin.gatheringId), venueName, gathering, photoUrl });
    });
    return () => {
      current = false;
    };
  }, [checkinId]);

  if (data === "missing") return <div className="app-page"><p className="list-message">This night isn&apos;t in your sky.</p></div>;
  if (!data) return <div className="app-page" aria-busy="true" />;

  const { checkin, nights, venueName, gathering, photoUrl } = data;
  const next = gathering?.upcoming[0];
  const color = artFormColor(checkin.artForm);

  return (
    <div className="app-page planet-page">
      <Link href="/sky" className="back-link">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Your Sky
      </Link>

      <svg className="planet-art" viewBox="0 0 220 150" aria-hidden="true">
        <ellipse cx="105" cy="82" rx="100" ry="28" fill="none" stroke="var(--color-border)" strokeWidth="3" />
        <circle cx="105" cy="82" r="52" fill={color} />
        <path d="M5 82 A100 28 0 0 0 205 82" fill="none" stroke="var(--color-border)" strokeWidth="3" />
        {checkin.moon && <circle cx="185" cy="22" r="16" fill="var(--color-moon)" />}
      </svg>

      <p className="eyebrow">
        Planet {checkin.planetNumber} · {dayText(checkin.startsAt)}
      </p>
      <h1 className="page-title">{checkin.title}</h1>
      <p className="screen-sub">
        {venueName} · {checkin.planetNumber === 1 ? "your first night here" : `your ${ordinal(checkin.planetNumber)} night here`}
      </p>

      <section className="planet-moon">
        {checkin.moon ? (
          <>
            <div className="planet-moon-top">
              <span>
                <span className="moon-dot" aria-hidden="true" /> Your moon
              </span>
              <span className="word-pill">{checkin.moon.word}</span>
            </div>
            {checkin.moon.note && <p className="planet-moon-note">“{checkin.moon.note}”</p>}
            {photoUrl && <img className="planet-moon-photo" src={photoUrl} alt="Your photo from this night" />}
          </>
        ) : (
          <div className="planet-moon-top">
            <span className="card-meta">No moon for this night.</span>
            <Link href={`/moon?c=${checkin.id}`} className="text-button">
              Leave a moon
            </Link>
          </div>
        )}
      </section>

      <h2 className="section-title">Moons around this sun</h2>
      <ul className="moon-chips">
        {nights.map((c) => (
          <li key={c.id}>
            <Link href={`/planet?c=${c.id}`} className={`moon-chip${c.moon ? "" : " no-moon"}${c.id === checkin.id ? " current" : ""}`} aria-current={c.id === checkin.id ? "page" : undefined}>
              {c.moon?.word ?? "No moon"} · {shortDayText(c.startsAt)}
            </Link>
          </li>
        ))}
      </ul>

      {next && gathering && (
        <section className="next-session">
          <span>
            <span className="card-meta">Next session</span>
            <strong>{sessionText(next.startsAt, next.endsAt)}</strong>
          </span>
          <PlanItButton
            session={next}
            title={gathering.title}
            venueName={gathering.venue.name}
            address={gathering.venue.address}
            howYouTakePart={gathering.howYouTakePart}
            sourceUrl={gathering.sourceUrl}
          />
        </section>
      )}
    </div>
  );
}
