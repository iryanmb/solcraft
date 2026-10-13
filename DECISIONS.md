# Decisions

Short log of choices that shape the project. Newest at the bottom.

## 2026-10-12: Project lives in `~/Desktop/Developer/solcraft`
- **Choice:** Moved the project out of `~/Documents/solcraft`.
- **Reason:** `~/Documents` was itself a Git repo (no commits) with personal files staged in it, so Solcraft was sitting inside it. iCloud "Desktop & Documents" sync was checked and is **off**, so Desktop is a safe local location.
- **Tradeoff:** If that iCloud sync is ever turned on, move the project to `~/Developer/solcraft` first. `node_modules` and `.git` shouldn't sync through iCloud.

## 2026-10-12: One Git repo per project; stray `~/Documents/.git` removed
- **Choice:** `git init` inside `solcraft/` only. The empty repo at `~/Documents/.git` was deleted after copying out 8 files that existed only in its staging area (to `~/Desktop/documents-git-rescue/`).
- **Reason:** A repo covering a whole personal folder could push personal files to GitHub by accident.
- **Tradeoff:** None for Solcraft. The rescued files now need a permanent home.

## 2026-10-12: Hand-written Next.js setup instead of `create-next-app`
- **Choice:** Wrote `package.json`, `tsconfig.json` and `app/` files by hand.
- **Reason:** The folder already had `CLAUDE.md` and `design/`, and the generator adds sample files and settings we'd delete. Writing the files by hand keeps every file understood.
- **Tradeoff:** No ESLint (code-style checker) yet. Add it when the codebase grows.

## 2026-10-12: Plain CSS with variables in one global stylesheet
- **Choice:** All design tokens (colors, fonts, radii, spacing, widths) are CSS variables in `app/globals.css`, with no Tailwind or UI library.
- **Reason:** Matches CLAUDE.md, has nothing extra to learn, and a token changes everywhere from one line.
- **Tradeoff:** One file will grow. Split it into per-component CSS Modules when it gets hard to read.

## 2026-10-12: Fonts via `next/font/google`
- **Choice:** Load Bricolage Grotesque (700/800) and DM Sans (400/500/700) with Next's built-in font loader.
- **Reason:** No extra package. Fonts are downloaded at build time and served from our own site, so there's no layout jump and visitors' browsers make no request to Google.
- **Tradeoff:** The build needs internet access to fetch the fonts.

## 2026-10-12: Sun outline stroke 3 by default
- **Choice:** `SunMark` uses stroke 3 (CLAUDE.md), with a `strokeWidth` prop.
- **Reason:** The mockups use 4–6 on small suns so the outline stays visible. The header sun (36px) uses 4.
- **Tradeoff:** Each small use has to pick its stroke.

## 2026-10-12: Keep Next's generated `AGENTS.md`
- **Choice:** Commit the `AGENTS.md` file that `next dev` writes.
- **Reason:** `next dev` re-creates it if deleted. It tells AI coding assistants to check the docs bundled with this Next version.
- **Tradeoff:** One file we didn't write ourselves.

## 2026-10-12: GitHub over SSH, merge instead of force-push
- **Choice:** Remote `origin` = `git@github.com:iryanmb/solcraft.git` (SSH). GitHub's auto-made README commit was merged in with `--allow-unrelated-histories`.
- **Reason:** The Mac's SSH key already works for `iryanmb`; the saved HTTPS password in Keychain is stale. Merging keeps both histories; force-pushing would delete a commit on GitHub.
- **Tradeoff:** One extra merge commit in the history.

## 2026-10-13: Public repo, private commit email
- **Choice:** The GitHub repo is public. Commits from here on use GitHub's noreply address (`168069750+iryanmb@users.noreply.github.com`), set for this repo only.
- **Reason:** A public repo shows every commit's author email. The noreply address keeps the Gmail out of new commits.
- **Tradeoff:** The first commits still show the Gmail; removing it would mean rewriting history and force-pushing, which isn't worth it.

## 2026-10-13: One placeholder marker, `xxx`
- **Choice:** A cell that is `xxx` is unknown; a value ending in ` xxx` is a best guess to confirm. Code stand-ins get a `// xxx:` comment saying what's needed; adjustable ones live in `lib/config.ts`. Unwritten pages say `xxx`. The app shows `xxx` as-is, in every environment.
- **Reason:** One marker is easy to search for (`grep -r xxx`) and impossible to mistake for a real event fact.
- **Tradeoff:** Screens look unfinished until the gaps are filled. That's intended.

## 2026-10-13: Under $20 rule
- **Choice:** A gathering counts when its lowest general-public price is under $20. Free and donation-based count. `xxx` and guessed (` xxx`) prices are unknown and left out of the filter.
- **Reason:** Costs are free text; a fixed rule keeps the filter honest and explainable.
- **Tradeoff:** Some cheap nights stay out of the filter until their price is confirmed.

## 2026-10-13: Sessions from `data/session-rules.json`
- **Choice:** Each gathering has either an RRULE or an explicit list of dates, in Atlanta time, for 2026. The 17 clear rules were confirmed; Songwriters Open Mic, Poetry on Peter, Art Out Loud, Collage Night, Lavender Lens, Saturday Matinee, Auburn Avenue Literary Society and Poetry & Wine use explicit dates; Swing Dance runs weekly through Dec 8; Figure Drawing Sessions is the 3rd Thursday. Figure Drawing (The Bakery) has no sessions (next date `xxx`).
- **Reason:** Plain-English recurrence ("Monthly, Wednesdays") can't be turned into dates without guessing.
- **Tradeoff:** Explicit date lists need updating by hand when they run out.

## 2026-10-13: Check-in and product rules for the pilot build
- **Choice:**
  - No end time → check-in closes 3 hours after start (config value, `xxx`); the app shows the end as `xxx`.
  - "Place" in badges = the same gathering, not the venue.
  - City from the address instead of neighborhoods.
  - The card opening in place is the gathering details screen.
  - Center I'm here with nothing on → "Nothing on right now" plus the next sessions this week.
  - Castleberry Hill (2nd Friday Art Stroll): no pin and no check-in until its address is known.
  - Moon copy says "a new sun" for a first visit.
  - No comets for now (no one-time events in the data).
  - Mockup items with no data are left out (neighborhoods, "Coming solo" chip, "Saved artist", Instagram/Profile in Settings).
- **Reason:** Answers to the open questions in the Milestone 2 plan (still valid after the change of plan below); CLAUDE.md wins over `design/`.
- **Tradeoff:** Screens differ from the mockups in those places.

## 2026-10-13: Dev panel behind an env variable
- **Choice:** The "pretend I'm there" dev panel is on at localhost, and on elsewhere with `?dev=1`, unless an environment variable switches it off (`xxx`: switch it off in production before the pilot).
- **Reason:** Testing check-ins away from venues, on localhost and the deployed site; real pilot users must not use it.
- **Tradeoff:** Anyone who knows `?dev=1` can use it until it's switched off.

## 2026-10-13: `profiles.sun_sign` is stored (deliberate exception)
- **Choice:** Store `sun_sign` even though it's derived from the birthday. It's a generated column: the database computes it from the birthday with `sun_sign_for()`, so nobody writes it by hand.
- **Reason:** The birthday is private to its owner, but others may see the sign, so the sign can't be computed from a field they can't read. Generating it means the two can never disagree.
- **Tradeoff:** The sign date ranges exist twice (the SQL function and `data/zodiac-constellations.json`); `npm run check-db` checks they match.

## 2026-10-13: The Google Sheet is the source; the CSV is its export
- **Choice:** `data/gatherings.csv` is the "Gatherings" tab exported as CSV. The "To check" tab stays out of the app.
- **Reason:** One place to edit gatherings.
- **Tradeoff:** Re-export the CSV after every sheet edit.

## 2026-10-13: One pilot build on Supabase, in 6 checkpoints
- **Choice:** Milestones 2–4 are merged into one pilot build, built on Supabase from the start: real email-code sign-in (Resend), moon photos (Storage, private) and the real data. No localStorage prototype. Six checkpoints (see CLAUDE.md), each stopping for my test, review and commit.
- **Reason:** I'm the only tester, so a throwaway prototype for friends isn't needed; building it twice would cost more than it teaches.
- **Tradeoff:** The first visible screens arrive later (checkpoint 2), and accounts (Supabase, Resend) must be set up first.

## 2026-10-13: `lib/store.ts` is the only door to data
- **Choice:** Every screen reads and writes through `lib/store.ts`, which calls the Supabase client in the browser.
- **Reason:** One place to change if the data source changes, and it keeps the core flows working without server-only Next.js features (for a later Capacitor wrap).
- **Tradeoff:** One more file between a screen and its data.

## 2026-10-13: Resend key stays as is
- **Choice:** Keep the existing Resend API key. It goes only into Supabase's SMTP settings (checkpoint 2), never into code, `.env.local`, Git or Vercel.
- **Reason:** My call; I understand it was exposed in a chat and accept that risk.
- **Tradeoff:** If it's ever misused, delete it in Resend and paste a new one into Supabase.

## 2026-10-13: No domain yet (`xxx`)
- **Choice:** Sign-in emails come from `onboarding@resend.dev`, which can only deliver to my own address. xxx: buy a domain (probably my name, with Solcraft on a subdomain) and verify it in Resend before anyone else signs in.
- **Reason:** I'm the only tester for now.
- **Tradeoff:** Nobody else can sign in until the domain is set up.

## 2026-10-13: Schema as SQL migrations, applied with the Supabase CLI
- **Choice:** Tables, permissions and RLS policies live in `supabase/migrations/*.sql`, applied with `npx supabase db push`. The CLI is a dev dependency, so its version is pinned in `package.json`.
- **Reason:** Every database change is a file in Git, with history, instead of clicks in the dashboard.
- **Tradeoff:** Changes go through a new migration file, not the Table Editor.

## 2026-10-13: Catalog details
- **Choice:**
  - Readable text ids for hosts, venues and gatherings (`wednesday-jazz-jam`); random UUIDs for sessions, check-ins and moons.
  - `gatherings.start_text` / `end_text` keep the CSV wording, including ` xxx` guesses.
  - `UNIQUE(gathering_id, starts_at)` on sessions, so re-importing updates instead of duplicating.
  - Sessions are created within 8 weeks of the day the import runs; re-running adds the rest and removes future sessions the rules no longer produce (never ones with check-ins).
  - Venues with the same name but different addresses stay separate (Eddie's Attic: 515-B vs 515 N McDonough St).
- **Reason:** Stable ids survive re-imports; nothing is merged or invented by guesswork.
- **Tradeoff:** Renaming a gathering in the sheet changes its id (it becomes a new gathering).

## 2026-10-13: Venue coordinates from the US Census Geocoder
- **Choice:** `npm run geocode` looks up each address once and saves it to `data/venue-locations.json`, with a map link to check. Misses are `xxx` and get entered by hand.
- **Reason:** Free, no key, public-domain data, and fine for ~20 addresses.
- **Tradeoff:** Its points are estimates along the street, so each pin needs a look; it doesn't know some campus addresses (Kendeda Building).

## 2026-10-13: Scripts in TypeScript, run directly by Node
- **Choice:** `scripts/*.ts` run with plain `node` (Node 26 strips the types itself) and read `.env.local` with `--env-file`. `package.json` has `"type": "module"`.
- **Reason:** No extra tools (ts-node, dotenv) to install or learn.
- **Tradeoff:** Imports between scripts need the `.ts` ending, and only type syntax that can simply be erased is allowed (`erasableSyntaxOnly`).

## 2026-10-13: Sign-in runs in the browser, pages are static
- **Choice:** The Supabase client (`lib/supabase.ts`) runs in the browser and keeps the session on the device. Pages are client components and are built as static files; `/` checks the account and sends you to Welcome, onboarding or Your Sky. No middleware, server actions or server cookies.
- **Reason:** CLAUDE.md asks the core flows not to depend on server-only Next.js features, so a Capacitor app can wrap the same pages later.
- **Tradeoff:** Each protected screen shows a blank frame for a moment while it checks the account, and the redirect happens in the browser. Row Level Security, not the redirect, is what protects the data.

## 2026-10-13: Onboarding details
- **Choice:**
  - Nothing is saved until Continue on the birthday step; then the profile is created and the database returns the sun sign shown in the reveal.
  - Back on the name step signs out and returns to the email step ("wrong email").
  - Birthday selects start empty (no pre-filled date); the year list includes under-18 years so the 18+ message can show.
  - "I have an account" uses the same code flow; it only changes the title and hides the progress bar (as in the mockup).
  - Placeholder Discover and Your Sky pages carry a temporary Sign out button (`xxx` until Settings in checkpoint 6). The color swatches moved to `/tokens`.
- **Reason:** Matches CLAUDE.md (one code flow, 18+) and the onboarding mockup; one source of truth for the sign.
- **Tradeoff:** Reloading during onboarding starts again at the name step.

## 2026-10-13: Extra UI colors from the onboarding mockup
- **Choice:** Added `--color-placeholder`, `--color-track`, `--color-disabled-text`, `--color-error`, `--color-star` and `--radius-input` (16px) to `app/globals.css`, taken from `design/source/Main.dc.html`.
- **Reason:** CLAUDE.md's tokens don't cover these small states; the mockup does.
- **Tradeoff:** More tokens than CLAUDE.md lists. Disabled-button text is low contrast, which is allowed for disabled controls.

## 2026-10-13: Discover rules
- **Choice:**
  - This week = Monday 00:00 to the next Monday 00:00, Atlanta time; sessions that already ended drop off.
  - One card per gathering, headlining its next session in the filter; sorted by that session; gatherings with no upcoming date come last and show "Next date: xxx".
  - Under $20 counts all gatherings (any date). The general-public price is the part of the cost before the first ";". A note shows how many have price `xxx` or a guess.
  - City comes from the address (`lib/gatherings.ts`); times are always shown in Atlanta time (`lib/time.ts`).
  - The open card is the gathering details: why it fits, When / Starts / Ends / You can / Cost / Age, the next four dates, address with a Directions link, host, source and last-checked date.
- **Reason:** Your answers on the checkpoint 3 plan; nothing shown that the data doesn't say.
- **Tradeoff:** A gathering meeting three times this week (Laughing Skull) shows one card; its other dates are in the details.

## 2026-10-13: Signed-in screens share one frame
- **Choice:** Pages in `app/(app)/` share `AppShell`: one account check, the profile passed down through React context, a bottom bar on phones (Discover takes the left half so I'm here sits dead center) and a sidebar from 900px.
- **Reason:** The account check and nav in one place instead of on every screen.
- **Tradeoff:** The bottom bar is slightly lopsided (Discover alone on the left); that's what keeps the I'm here button in the middle with four places.

## 2026-10-13: Shared helpers in `lib/`, used by app and scripts
- **Choice:** Atlanta date/time math (`lib/time.ts`), the `xxx` marker (`lib/placeholders.ts`) and derived facts (`lib/gatherings.ts`) live in `lib/`; the scripts import them. Their imports end in `.ts` so Node can run them directly.
- **Reason:** One copy of each rule for both the import and the screens.
- **Tradeoff:** `lib/` mixes the two import styles (with and without `.ts`).

## 2026-10-13: Map with OpenFreeMap + MapLibre (not CARTO)
- **Choice:** The Discover map uses OpenFreeMap's dark style (free, no key, commercial use allowed), drawn by MapLibre GL JS, pinned to exactly 6.11.2 (a release at least two weeks old). Its background and water are tinted with `--color-bg` / `--color-surface`. One sun pin per venue in the current filter; tapping a pin narrows the list to that venue ("Show all" returns). Side by side with the list from 1100px wide.
- **Reason:** CARTO's free tiles now need an API key (an account); OpenFreeMap needs none and its map can use Solcraft's colors.
- **Tradeoff:** MapLibre is large, so it loads only when the map is opened (`next/dynamic`, browser only). OpenFreeMap is a donation-funded project with no uptime guarantee. MapLibre's background worker files are copied into `public/maplibre/` after every `npm install` (`scripts/copy-map-worker.ts`, git-ignored), because Next's build doesn't include them.

## 2026-10-13: The database is the bouncer for check-ins
- **Choice:** Check-ins are created only by the database function `check_in()`. It checks the session is scheduled, that now is inside the window, and the distance to the venue (150 m + up to 100 m of the phone's reported accuracy), then discards the coordinates. Retries return the existing check-in. The window (1 h before; 1 h after the end, or 4 h after the start with no end) and the radius live only in the database; the app reads `opens_at`/`closes_at` from the `session_windows` view.
- **Reason:** Anything running on a phone can be tampered with; only the database can enforce the rules. One copy of the numbers can't drift.
- **Tradeoff:** Changing a window or radius means a new migration, not an edit to `lib/config.ts`.

## 2026-10-13: Testers, and a dev panel only they can use
- **Choice:** `profiles.is_tester` (off by default; nobody can set it from the app, only in the Table Editor). The dev panel shows for testers on localhost or after `?dev=1`, unless `NEXT_PUBLIC_DEV_PANEL=off`. Its switches: pretend I'm there, pretend it's session time, show the moon now, delete my check-ins. The database honors "pretend" only for testers.
- **Reason:** Testing away from venues without letting pilot users fake check-ins (which would spoil the return-visit measure).
- **Tradeoff:** Pretend check-ins are real rows; delete them from the dev panel before the pilot.

## 2026-10-13: Suns and planets numbered by a view
- **Choice:** `my_checkins` (a view that follows RLS) numbers each person's nights per gathering by session start; planet 1 is the sun. The check-in moment and the moon read it; nothing is stored as a counter.
- **Reason:** CLAUDE.md: derive, don't duplicate.
- **Tradeoff:** A check-in added for an earlier session (testing) renumbers the later ones.

## 2026-10-13: Moons and their photos
- **Choice:** The moon is offered on the first open from 6 AM the day after the session (Atlanta), for the most recent check-in of the last week without a moon. A word saves the moon at once; the line (max 280 characters) saves as you type; "Not now" hides it on this device. Photos are shrunk to 1600 px and re-saved as JPEG in the browser, which drops EXIF (including GPS), then stored in the private `moon-photos` bucket under the user's own folder; they're shown through links that expire after an hour.
- **Reason:** CLAUDE.md: moons and photos private, location never stored.
- **Tradeoff:** "Not now" is remembered per device, so another phone may offer the same moon.

## 2026-10-13: Check-in moment wording for planets
- **Choice:** First visit: "A new sun." + "Your first time at [gathering], [venue]. It's in your sky now." + "Sun N". Later visits: "Planet N." + "Your Nth night at [gathering]. It's orbiting your sun now." Sun Road and badge pills come in checkpoint 5.
- **Reason:** No mockup for a planet moment; this matches the sun moment and the planet screen's "your 4th night here".
- **Tradeoff:** Copy to review with real users.
