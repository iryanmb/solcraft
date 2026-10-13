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

### Checkpoint 5: Your Sky, Planet, Sun Road
- [ ] **Build your sky.** With the dev switches on, check in to 3–4 different gatherings and twice to one of them. Open **Your Sky**: tap a sun, then one of its nights to open the planet screen. *Learn:* the whole drawing is worked out from your check-ins each time.
- [ ] **Find a constellation.** Check in to two gatherings with the same art form (Wednesday Jazz Jam and Friday Jazz are both Jazz) and look for the arc of stars between them. *Learn:* constellations are derived, not saved.
- [ ] **Walk the Sun Road.** Open **Sun Road**, read the two tips, then tap each badge to see its challenge. Press **?** to see the tips again. *Learn:* badges need both the step and the challenge.
- [ ] **Move a sun.** In `components/SkyMap.tsx`, change the first entry in `SPOTS` from `[115, 165]` to `[115, 120]`. Your first sun moves up. Put it back. *Learn:* suns sit at fixed spots, in the order you found them.

### Checkpoint 6: Settings, Plan it, legal, Home Screen
- [ ] **Edit yourself.** Open Settings (the gear on Your Sky on a phone, or your name at the bottom of the sidebar). Change your name, then your birthday by one month, and watch your sign change. Change it back. *Learn:* the database works out the sign from the birthday.
- [ ] **Plan a night.** Open any planet (Your Sky → tap a sun → a night) or an open Discover card, tap **Plan it**, and add it to your calendar. *Learn:* a .ics file is just text your calendar app understands; there are no reminders in it.
- [ ] **Add Solcraft to your Home Screen.** On your iPhone in Safari, open solcraft-pi.vercel.app, tap Share → **Add to Home Screen**. Open it from the icon: no browser bars. *Learn:* the manifest and icons make a website feel like an app.
- [ ] **Write the legal pages.** Replace the `xxx` in `app/terms/page.tsx` and `app/privacy/page.tsx` with your own words (or have them reviewed). *Learn:* nothing else changes when an `xxx` is replaced.

## Also on my list
- [ ] Move the files in `~/Desktop/documents-git-rescue/` (3 photos, BreakThroughTech projects, resume) somewhere permanent, then delete that folder.
- [ ] Before anyone else signs in: buy a domain, verify it in Resend, and change the SMTP sender in Supabase from `onboarding@resend.dev` (DECISIONS.md, "No domain yet"). Then add "change email" to Settings.
- [ ] Before the pilot: decide the public wording for every `xxx` (search the project for `xxx`).
- [ ] Before the pilot: on Vercel, add `NEXT_PUBLIC_DEV_PANEL` = `off` (Settings → Environment Variables), and use "Delete my check-ins" to clear test check-ins.
- [ ] Before the pilot: confirm the check-in window (1 h before / 1 h after / 4 h with no end) and the 150 m radius at a real venue; they're `xxx` in `supabase/migrations/*_checkins_and_moons.sql`.
- [ ] Before the pilot: remember that free Supabase projects pause after a week with no activity.
