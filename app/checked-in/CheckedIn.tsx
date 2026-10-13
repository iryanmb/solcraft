"use client";

// The check-in moment (design/screens/pilot/03): warm light, the new sun or planet.
// The check-in was saved before this screen opened; this only reads it back.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import SunMark from "@/components/SunMark";
import { artFormColor, ordinal } from "@/lib/gatherings";
import { getMyCheckins, getSunRoad, getVenueName, type MyCheckin } from "@/lib/store";
import { useAccount } from "@/lib/useAccount";

type Moment = { checkin: MyCheckin; venueName: string; sunCount: number; badges: string[] };

export default function CheckedIn() {
  const router = useRouter();
  const checkinId = useSearchParams().get("c");
  const account = useAccount();
  const [moment, setMoment] = useState<Moment | null>(null);

  useEffect(() => {
    if (account === null) {
      router.replace("/welcome");
      return;
    }
    if (!account || !checkinId) return;
    let current = true;
    Promise.all([getMyCheckins(), getSunRoad()]).then(async ([all, road]) => {
      const checkin = all.find((c) => c.id === checkinId);
      if (!checkin) {
        if (current) router.replace("/sky");
        return;
      }
      const sunCount = all.filter((c) => c.planetNumber === 1 && c.kind === "recurring").length;
      const venueName = await getVenueName(checkin.venueId);
      // Badges this very check-in earned (the database decides; see my_sun_road()).
      const badges = road.badges.filter((b) => b.earnedCheckinId === checkin.id).map((b) => b.name);
      if (current) setMoment({ checkin, venueName, sunCount, badges });
    });
    return () => {
      current = false;
    };
  }, [account, checkinId, router]);

  if (!moment) return <div className="moment" aria-busy="true" />;

  const { checkin, venueName, sunCount, badges } = moment;
  const isSun = checkin.planetNumber === 1;

  return (
    <div className="moment">
      <div className="moment-body">
        <p className="moment-eyebrow">Checked in</p>
        <div className="moment-glow rise" aria-hidden="true">
          {isSun ? (
            <SunMark size={190} strokeWidth={4} />
          ) : (
            <svg viewBox="0 0 200 200" width="190" height="190">
              <ellipse cx="100" cy="100" rx="96" ry="30" fill="none" stroke="var(--color-ink)" strokeWidth="5" opacity="0.5" />
              <circle cx="100" cy="100" r="58" fill={artFormColor(checkin.artForm)} stroke="var(--color-ink)" strokeWidth="5" />
              <path d="M8 100 A96 30 0 0 0 192 100" fill="none" stroke="var(--color-ink)" strokeWidth="5" />
            </svg>
          )}
        </div>
        <h1 className="moment-title">{isSun ? "A new sun." : `Planet ${checkin.planetNumber}.`}</h1>
        <p className="moment-text">
          {isSun ? (
            <>
              Your first time at <strong>{checkin.title}</strong>
              {venueName && `, ${venueName}`}. It&apos;s in your sky now.
            </>
          ) : (
            <>
              Your {ordinal(checkin.planetNumber)} night at <strong>{checkin.title}</strong>. It&apos;s orbiting your sun now.
            </>
          )}
        </p>
        <div className="moment-pills">
          {isSun && <span className="moment-pill">Sun {sunCount}</span>}
          <span className="moment-pill">Night {checkin.step}</span>
          {badges.map((name) => (
            <span key={name} className="moment-pill">
              Badge: {name}
            </span>
          ))}
        </div>
      </div>
      <div className="moment-foot">
        <p className="moment-text">Phone away. Enjoy the room.</p>
        <Link href="/sky" className="btn moment-done">
          Done
        </Link>
      </div>
    </div>
  );
}
