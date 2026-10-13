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

## Also on my list
- [ ] Move the files in `~/Desktop/documents-git-rescue/` (3 photos, BreakThroughTech projects, resume) somewhere permanent, then delete that folder.
- [ ] Before anyone else signs in: buy a domain, verify it in Resend, and change the SMTP sender in Supabase from `onboarding@resend.dev` (DECISIONS.md, "No domain yet").
- [ ] Before the pilot: decide the public wording for every `xxx` (search the project for `xxx`).
- [ ] Before the pilot: switch the dev panel off in production (env variable, from checkpoint 4).
- [ ] Before the pilot: remember that free Supabase projects pause after a week with no activity.
