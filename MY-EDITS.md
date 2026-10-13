# My edits

Small changes to make myself, to learn how the pieces connect. Each step adds one.
Tick a box when it's done (`[ ]` → `[x]`). Line numbers can drift; search for the quoted text.

## Edits

### Milestone 1: Hello, sun
- [ ] **Resize the sun.** In `app/welcome/page.tsx`, change `<SunMark size={132} />` to `size={180}`, and the `width: 132` on the line above it to `180`. Save and watch http://localhost:3000/welcome update. *Learn:* a component's props control how it draws; the wrapper's width has to match, or the glow sits off-center. (This edit moved: it was on the old home page.)
- [ ] **Watch a deploy happen.** Change the line "Poetry, jazz, comedy and more, across Atlanta." in `app/welcome/page.tsx` to anything, then run `git add app/welcome/page.tsx`, `git commit -m "Try a deploy"` and `git push`. Open the project's **Deployments** tab on Vercel and watch it build. Change it back the same way. *Learn:* a push to GitHub is the deploy.
- [ ] **Check phone and desktop widths.** In Chrome, open http://localhost:3000/welcome, press `Cmd+Option+I`, then `Cmd+Shift+M`. Try widths 390 and 1440: nothing scrolls sideways and the fonts look right. Press Tab: the "Skip to content" link and the yellow focus rings appear. *Learn:* how to test a mobile-first layout without a phone.

### Checkpoint 1: Supabase, schema, data
- [ ] **Place the Kendeda Building pin.** On Google Maps, right-click the Kendeda Building (Georgia Tech) and click the coordinates at the top of the menu to copy them. In `data/venue-locations.json`, under `"kendeda-building-room-230"`, replace the two `"xxx"` values with the numbers (no quotes) and delete its `note` line. Run `npm run import`, then `npm run check-db`: only Castleberry Hill should still lack a pin. *Learn:* the data files drive the database; the import carries your changes in.
- [ ] **Move a session time.** In `data/session-rules.json`, change Poetry on Peter's `"start": "20:30"` to `"20:45"`. Run `npm run import`, then in Supabase's Table Editor open `sessions`, filter `gathering_id` = `poetry-on-peter`, and see the new times (stored in UTC, so 8:45 PM shows as 00:45 or 01:45 the next day). Put it back to `"20:30"` and import again. *Learn:* one rules file → real sessions, and re-running the import updates instead of duplicating.

### Checkpoint 2: Sign-in and onboarding
- [ ] **Rewrite an error message.** In `lib/store.ts`, change "That code didn't work. Check it, or send a new one." to your own words. Save, enter a wrong code on localhost, and see your words. *Learn:* screens get their messages from the store.

### Checkpoint 3: Discover
- [ ] **Move the Under $20 line.** In `lib/gatherings.ts`, inside `isUnderTwenty`, change `< 20` to `< 12`. Run `npm run check-derived` and see which gatherings flip to "no", then open Discover and watch the Under $20 count drop. Put it back to `< 20`. *Learn:* the filter is a rule in code worked out from the cost text, not a stored yes/no.
- [ ] **Change the map's starting view or pin size.** In `app/globals.css`, find `.map-pin svg` and change `28px` to `36px` (both lines). Open Discover → Map and see bigger suns. Put it back. *Learn:* the pins are ordinary HTML buttons styled with our CSS, sitting on top of the map.

### Checkpoint 4: I'm here, check-in moment, moons
- [ ] **Make yourself a tester (needed for the dev panel).** In Supabase: **Table Editor → profiles**, find your row, set `is_tester` to `true`, save. Reload localhost: a dashed "Dev" button appears above the nav. *Learn:* the database decides who may pretend; the app can't change that column.
- [ ] **Check in from your couch.** In the Dev panel, tick "Pretend I'm there" and "Pretend it's session time". Open **I'm here** (center button), tap I'm here on any session, see "A new sun." Then check in to a second session of the same gathering and see "Planet 2." *Learn:* suns and planets are just numbered check-ins.
- [ ] **See what a check-in stores.** In **Table Editor → checkins**, open your row: there are no coordinates, only who, which session, `method` and when. *Learn:* the location is checked and thrown away.
- [ ] **Leave a moon.** Tick "Show the moon now", open Discover, pick a word, add a line and a photo. Then in **Storage → moon-photos** find your folder (named after your user id). *Learn:* private files live in your own folder.
- [ ] **Change the moon's morning hour.** In `lib/config.ts`, set `MOON_HOUR` to `9`. *Learn:* this one setting lives in the app because only the app decides when to offer the moon. Put it back to `6`.

## Also on my list
- [ ] Move the files in `~/Desktop/documents-git-rescue/` (3 photos, BreakThroughTech projects, resume) somewhere permanent, then delete that folder.
- [ ] Before anyone else signs in: buy a domain, verify it in Resend, and change the SMTP sender in Supabase from `onboarding@resend.dev` (DECISIONS.md, "No domain yet").
- [ ] Before the pilot: decide the public wording for every `xxx` (search the project for `xxx`).
- [ ] Before the pilot: on Vercel, add `NEXT_PUBLIC_DEV_PANEL` = `off` (Settings → Environment Variables), and use "Delete my check-ins" to clear test check-ins.
- [ ] Before the pilot: confirm the check-in window (1 h before / 1 h after / 4 h with no end) and the 150 m radius at a real venue; they're `xxx` in `supabase/migrations/*_checkins_and_moons.sql`.
- [ ] Before the pilot: remember that free Supabase projects pause after a week with no activity.
