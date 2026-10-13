"use client";

// One gathering in Discover. Tapping the top opens the details in place
// (the card IS the gathering details screen). Unknown values show as xxx.

import { cityOf } from "@/lib/gatherings";
import { XXX, isUnknown } from "@/lib/placeholders";
import type { DiscoverGathering, Session } from "@/lib/store";
import { sessionText, shortDayText } from "@/lib/time";

type GatheringCardProps = {
  gathering: DiscoverGathering;
  /** The session to headline: the next one in the current filter, or none. */
  session: Session | undefined;
  open: boolean;
  onToggle: () => void;
};

// "2026-10-13" -> "Oct 13, 2026" (a calendar date, so no time zone shift)
const verifiedText = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric" }).format(new Date(`${iso}T00:00:00Z`));

export default function GatheringCard({ gathering: g, session, open, onToggle }: GatheringCardProps) {
  const detailsId = `details-${g.id}`;
  const next = g.upcoming.slice(0, 4);

  return (
    <article className={`card${open ? " open" : ""}`}>
      <h2 className="card-heading">
        <button type="button" className="card-toggle" aria-expanded={open} aria-controls={detailsId} onClick={onToggle}>
          <span className="card-when">{session ? sessionText(session.startsAt, session.endsAt) : `Next date: ${XXX}`}</span>
          <span className="card-title">{g.title}</span>
          <span className="card-meta">
            {g.venue.name} · {cityOf(g.venue.address)} · {g.costText}
          </span>
        </button>
      </h2>

      {open && (
        <div id={detailsId} className="card-details">
          <p className="card-why">{g.whyItFits}</p>

          <dl className="tiles">
            <div className="tile">
              <dt>When</dt>
              <dd>{g.recurrenceText}</dd>
            </div>
            <div className="tile">
              <dt>Starts</dt>
              <dd>{g.startText}</dd>
            </div>
            <div className="tile">
              <dt>Ends</dt>
              <dd>{g.endText}</dd>
            </div>
            <div className="tile">
              <dt>You can</dt>
              <dd>{g.howYouTakePart}</dd>
            </div>
            <div className="tile">
              <dt>Cost</dt>
              <dd>{g.costText}</dd>
            </div>
            <div className="tile">
              <dt>Age</dt>
              <dd>{g.ageText}</dd>
            </div>
          </dl>

          <p className="card-line">
            <strong>Next: </strong>
            {next.length ? next.map((s) => shortDayText(s.startsAt)).join(" · ") : XXX}
          </p>
          <p className="card-line">
            <strong>{g.venue.name}</strong>
            {" · "}
            {g.venue.address}
            {!isUnknown(g.venue.address) && (
              <>
                {" · "}
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(g.venue.address)}`} target="_blank" rel="noopener noreferrer">
                  Directions ↗
                </a>
              </>
            )}
          </p>
          <p className="card-line">Hosted by {g.hostName}</p>
          <p className="card-line muted">
            <a href={g.sourceUrl} target="_blank" rel="noopener noreferrer">
              Source ↗
            </a>
            {" · "}Checked {verifiedText(g.lastVerifiedAt)}
          </p>
        </div>
      )}
    </article>
  );
}
