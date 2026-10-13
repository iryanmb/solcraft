"use client";

// Plan it: adds one session to the phone's own calendar (a .ics file). No reminders.

import { isUnknown } from "@/lib/placeholders";
import { buildIcs, downloadIcs } from "@/lib/ics";
import type { Session } from "@/lib/store";

type PlanItButtonProps = {
  session: Session;
  title: string;
  venueName: string;
  address: string;
  howYouTakePart: string;
  sourceUrl: string;
};

export default function PlanItButton({ session, title, venueName, address, howYouTakePart, sourceUrl }: PlanItButtonProps) {
  return (
    <button
      type="button"
      className="btn btn-primary plan-it"
      onClick={() =>
        downloadIcs(
          `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.ics`,
          buildIcs({
            id: session.id,
            title,
            startsAt: session.startsAt,
            endsAt: session.endsAt,
            location: isUnknown(address) ? venueName : `${venueName}, ${address}`,
            description: `How you take part: ${howYouTakePart}\nSource: ${sourceUrl}`,
            url: sourceUrl,
          }),
        )
      }
    >
      Plan it
    </button>
  );
}
