"use client";

// Sun Road (design/screens/pilot/07a–07d): 50 steps, drawn to scale, bottom to top. Every
// check-in is one step. Five badges light up when you reach their step AND finish their
// challenge (the database decides: my_sun_road()). Two first-time tips sit in the badge card.

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import SunMark from "@/components/SunMark";
import { BADGE_INFO, BadgeIcon, badgeStatus } from "@/lib/badges";
import { getSunRoad, StoreError, type SunRoad } from "@/lib/store";

const MAX = 50; // CLAUDE.md: 50 steps
const STEP = 11; // pixels per step (from the mockup)
const PAD = 26;
const X = 76; // where the road runs
const NODE = 40; // badge circle size
const ROAD_HEIGHT = PAD * 2 + (MAX - 1) * STEP;
const Y = (n: number) => PAD + (MAX - n) * STEP; // step n's height on the road (1 at the bottom)

const TIPS = [
  { title: "This is you", text: "Every night out moves you one step up the road." },
  { title: "Badges light up along the way", text: "Each one has a small challenge. Tap a badge to see it." },
];
const TIPS_SEEN = "solcraft-road-tips-seen";

export default function SunRoadPage() {
  const [road, setRoad] = useState<SunRoad | null>(null);
  const [error, setError] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const [tip, setTip] = useState<number | null>(null); // which tip shows, or none
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getSunRoad()
      .then(setRoad)
      .catch((e) => setError(e instanceof StoreError ? e.message : "Couldn't load your Sun Road. Try again."));
    try {
      if (!localStorage.getItem(TIPS_SEEN)) setTip(0);
    } catch {
      // no storage: skip the tips
    }
  }, []);

  // Start scrolled to where you are on the road.
  useLayoutEffect(() => {
    const box = scroller.current;
    if (!box || !road) return;
    box.scrollTop = Y(Math.max(road.nights, 1)) - box.clientHeight * 0.6;
  }, [road]);

  function closeTips() {
    setTip(null);
    try {
      localStorage.setItem(TIPS_SEEN, "1");
    } catch {
      // ignore
    }
  }

  if (error) return <div className="app-page"><p className="list-message" role="alert">{error}</p></div>;
  if (!road) return <div className="app-page"><p className="list-message" aria-busy="true">Loading…</p></div>;

  const nights = road.nights;
  const here = Math.min(Math.max(nights, 1), MAX);
  const next = road.badges.find((b) => !b.earnedAt);
  const selected = road.badges.find((b) => b.name === picked) ?? next ?? road.badges[road.badges.length - 1];
  const badgeSteps = new Set(road.badges.map((b) => b.step));

  return (
    <div className="app-page">
      <header className="road-head">
        <h1 className="page-title">Sun Road</h1>
        <button type="button" className="help-button" aria-label="Show the tips" onClick={() => setTip(0)}>
          ?
        </button>
        <p className="road-nights">
          <strong>{nights}</strong> {nights === 1 ? "night" : "nights"}
        </p>
      </header>

      <div className="road-layout">
        <div className="road-card" ref={scroller}>
          <div className="road" style={{ height: ROAD_HEIGHT }}>
            <svg className="road-line" width="100%" height={ROAD_HEIGHT} aria-hidden="true">
              <line x1={X} y1={Y(MAX)} x2={X} y2={Y(1)} stroke="var(--color-border)" strokeWidth={6} strokeDasharray="1 10" strokeLinecap="round" />
              {nights > 0 && <line x1={X} y1={Y(here)} x2={X} y2={Y(1)} stroke="var(--color-sun)" strokeWidth={6} strokeLinecap="round" />}
              {Array.from({ length: MAX }, (_, i) => i + 1)
                .filter((n) => !badgeSteps.has(n) && n !== here)
                .map((n) => (
                  <circle key={n} cx={X} cy={Y(n)} r={2.2} fill={n < nights ? "var(--color-sun-light)" : "var(--color-border)"} />
                ))}
            </svg>

            {road.badges.map((b) => {
              const state = b.earnedAt ? "earned" : b === next ? "next" : "later";
              return (
                <div key={b.name}>
                  <button
                    type="button"
                    className={`road-badge ${state}${b === selected ? " selected" : ""}${tip === 1 && b === next ? " ringed" : ""}`}
                    style={{ left: X - NODE / 2, top: Y(b.step) - NODE / 2 }}
                    aria-label={`${b.name}, night ${b.step}${b.earnedAt ? ", earned" : ""}`}
                    aria-pressed={b === selected}
                    onClick={() => {
                      setPicked(b.name);
                      closeTips();
                    }}
                  >
                    <BadgeIcon name={b.name} size={22} />
                  </button>
                  <span className={`road-label ${state}`} style={{ left: X + NODE / 2 + 14, top: Y(b.step) - 19 }}>
                    <strong>{b.name}</strong>
                    <span>Night {b.step}</span>
                  </span>
                </div>
              );
            })}

            <span className={`road-you${tip === 0 ? " ringed" : ""}`} style={{ left: X - 66, top: Y(here) - 22 }} aria-label={`You: night ${nights}`}>
              <SunMark size={36} strokeWidth={5} />
            </span>
          </div>
        </div>

        <section className="badge-card" aria-live="polite">
          {tip !== null ? (
            <>
              <p className="kicker">
                Tip {tip + 1} of {TIPS.length}
              </p>
              <h2 className="panel-title">{TIPS[tip].title}</h2>
              <p className="screen-sub">{TIPS[tip].text}</p>
              <div className="tip-buttons">
                <button type="button" className="text-button muted-button" onClick={closeTips}>
                  Skip
                </button>
                <span>
                  {tip > 0 && (
                    <button type="button" className="chip" onClick={() => setTip(tip - 1)}>
                      Back
                    </button>
                  )}
                  <button type="button" className="btn btn-primary tip-next" onClick={() => (tip + 1 < TIPS.length ? setTip(tip + 1) : closeTips())}>
                    {tip + 1 < TIPS.length ? "Next" : "Got it"}
                  </button>
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="badge-card-top">
                <span className={`medal ${selected.earnedAt ? "earned" : selected === next ? "next" : "later"}`}>
                  <BadgeIcon name={selected.name} size={30} />
                </span>
                <span>
                  <h2 className="panel-title">{selected.name}</h2>
                  <span className={`badge-status${selected.earnedAt ? " done" : ""}`}>{badgeStatus(selected, nights)}</span>
                </span>
              </div>
              <div className="challenge-row">
                {selected.challengeDone ? (
                  <svg width="26" height="26" viewBox="0 0 26 26" aria-label="Done">
                    <circle cx="13" cy="13" r="12" fill="var(--color-sun)" />
                    <path d="M8 13.5l3.2 3.2L18 10" fill="none" stroke="var(--color-ink)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <span className="challenge-progress">
                    {selected.progress} of {selected.goal}
                  </span>
                )}
                <span>{BADGE_INFO[selected.name]?.challenge}</span>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
