# Solcraft

Solcraft helps people find recurring cultural gatherings in Atlanta (poetry nights, jazz jams, improv, figure drawing, book clubs), show up, and keep coming back. Mission: nourish the soul through rooms you return to. Mobile-first web app (any phone browser, installable to the Home Screen). Pilot city: Atlanta.

**The pilot proves one thing:** do first-time visitors come back? Success metric: the share of first visits that return to the same gathering within 4 weeks. Build only what serves that until the pilot is done.

## How I want to work
- I'm learning Git, JavaScript/TypeScript and React. Before big changes, show a plan and explain the why in plain language.
- Explain each command before running it and each important file when it's created.
- One small feature per step. After each step: what changed, which files, and one small edit for me to make myself.
- Add every "edit for me" to `MY-EDITS.md` (with what it teaches), so I can do them later. Keep its file paths current when code moves.
- I type the git commands myself; tell me what to run and check my work with `git status`.
- Never invent event facts (dates, prices, "beginner-friendly", accessibility). Anything unknown is the placeholder `xxx` (see Placeholders).
- Never commit secrets. Keys live in `.env.local`, which is git-ignored.
- Keep DECISIONS.md (choice, reason, tradeoff) up to date.
- When this file and `design/` disagree, this file wins. Tell me about the conflict.

## Stack
- Next.js (App Router) + TypeScript
- Plain CSS with CSS variables for design tokens (no Tailwind, no UI component libraries)
- Supabase: Postgres, Auth (email one-time code), Row Level Security, Storage (moon photos)
- Email delivery for sign-in codes: Resend (free tier) as Supabase's custom SMTP. Supabase's built-in email is for testing only.
- Vercel for hosting, deploys from GitHub
- Web app manifest so it can be added to the Home Screen
- **Keep a later App Store wrap possible (Capacitor):** core screens fetch data in the browser through the Supabase client. Avoid relying on server-only Next.js features (server actions, server-only data loading) for the core flows.

## The world (product vocabulary)
- **Sun**: your first check-in at a recurring gathering. One sun per gathering, ever.
- **Planet**: every check-in at a recurring gathering, including the first. Planets orbit that gathering's sun.
- **Comet**: a check-in at a one-time event.
- **Moon**: an optional, private memory of one night: one word (Moved, Joyful, Inspired, Calm, Curious, Not for me), plus an optional line, plus an optional photo. Offered the next morning.
- **Constellation**: suns that share an art form, joined by a thin arc of stars.
- **Birth constellation**: the zodiac constellation from the user's birthday. It's the first thing in their sky, with its name under it (e.g. "Leo").
- **Your Sky**: the screen that draws all of the above. Two tabs: Sky and Moons.
- **Sun Road**: the progress road (rules below).
- **Astrology is decoration only:** birthday → sun sign → birth constellation in the sky + the sign on the profile ("Atlanta · Leo"). No astrology-based recommendations, no birth charts.

## Sun Road
- 50 steps. **Every check-in (sun, planet or comet) moves you one step.**
- Five badges on the road. A badge is earned when you reach its step **and** finish its challenge. You keep walking either way; the badge lights when both are true.

| Badge | Step | Challenge |
|---|---|---|
| First Light | 1 | none |
| Dawn | 5 | come back to a place once (any second visit to the same gathering) |
| Radiant | 10 | suns in 3 art forms |
| Zenith | 25 | 5 nights at one gathering |
| Galaxy | 50 | suns at 8 different gatherings |

- "Place" in every challenge means a gathering, not a venue (Charis hosts several gatherings).
- No streaks, no leaderboards.
- Two first-time tips appear in the badge card (not a full-screen overlay): "This is you" (rings your marker) and "Badges light up along the way" (rings the next badge). Back, Next, Skip.

## Onboarding and accounts
- Flow (see `design/screens/pilot/01*`): Welcome → email → 6-digit code → first name → birthday → constellation reveal ("Your sky begins with Leo, Ryan.") → Discover.
- "I have an account" → email → code → "Welcome back, [name]." → Your Sky. Sign-up and sign-in are the same code flow. No passwords.
- Birthday is required; must be 18+. Show "Solcraft is for people 18 and older." and block Continue if younger.
- Sessions persist on the device (Supabase handles this).
- Sign in with Apple is NOT needed (we don't offer third-party sign-in).

## Check-in ("I'm here")
- Default method is location. During a session's window (1 hour before start to 1 hour after end), the gathering shows **I'm here**. If a session has no end time, the window closes 3 hours after the start (an app setting in `lib/config.ts`); the app shows the end time as `xxx` for now.
- Tap → browser asks for location once → if within ~150 m of the venue (make the radius a setting), save the check-in. Account for reported accuracy; on failure show "We couldn't confirm your location." with Try again.
- **Never store coordinates.** Store only the check-in and `method = 'location'`.
- Save the check-in first, then play the moment (warm light, the new sun or planet). Closing the animation never loses it. Respect reduced motion.
- Retries and double taps never create duplicates (UNIQUE(user_id, session_id) + upsert).
- QR check-in for partner hosts comes later (`method = 'qr'`).

## Data model (derive, don't duplicate)
- `profiles` (id = auth user id, display_name, birthday, sun_sign, created_at). Birthday readable only by its owner; others see display_name and sun_sign.
- `hosts` (id, name, contact)
- `venues` (id, name, address, lat, lng)
- `gatherings` (id, host_id, venue_id, title, art_form, kind: 'recurring' | 'one_time', recurrence_text, start_text, end_text, how_you_take_part, why_it_fits, cost_text, age_text, source_url, last_verified_at, status: 'draft' | 'published'). start_text/end_text keep the CSV wording ("9:15 PM (doors 8:30)", "About 10:00 PM xxx").
- `sessions` (id, gathering_id, starts_at, ends_at nullable, status: 'scheduled' | 'cancelled', UNIQUE(gathering_id, starts_at))
- `checkins` (id, user_id, session_id, method: 'location' | 'qr', created_at, UNIQUE(user_id, session_id))
- `moons` (id, checkin_id UNIQUE, word, note nullable, photo_path nullable, created_at). Owner-only via RLS. Photos in a private Storage bucket.
- Suns, planets, comets, constellations, road steps and badges are computed from `checkins` (SQL views or functions), never stored as counters.

## Gatherings data
- `data/gatherings.csv` = 28 verified Atlanta gatherings (exported from my Google Sheet). Columns: Gathering, Art form, Host, Venue, Address, Recurrence, Start, End, Cost, Age, How you take part, Why it fits Solcraft, Source, Last verified.
- Recurrence is plain English ("Monthly, 3rd Friday"). Sessions come from either a confirmed RRULE or an explicit list of dates per gathering (`data/session-rules.json`). Generate the next 8 weeks. Gatherings with neither show "Next date not listed".
- The Google Sheet is where I edit; `data/gatherings.csv` is its export and the build's source of truth.
- "Under $20": the lowest general-public price is under $20; free and donation-based count; blank or "price not listed" is unknown and excluded.
- Addresses need lat/lng. Propose how (a free geocoder within its usage policy, or I enter them), and flag rows without a single address (e.g. "Galleries across Castleberry Hill").
- `data/zodiac-constellations.json` = the 12 constellation figures (SVG path + stars with brightness) and sun-sign date ranges. Keep its attribution line (d3-celestial, BSD-3-Clause) and credit it on an About or Terms page.

## Placeholders: always `xxx`
- One marker everywhere: `xxx`. Searching the project for `xxx` must find every placeholder, in data, code and copy.
- **Data:** in `data/gatherings.csv`, a cell that is `xxx` is unknown. A value followed by ` xxx` (e.g. "About $20 at the door xxx", "Monthly, usually 3rd Thursday xxx") is a best guess to confirm.
- **Code:** mark every stand-in with a comment starting `// xxx:` and what's needed, e.g. `// xxx: Castleberry Hill has no single address, so no map pin or check-in until it has one.` Adjustable stand-in values (3-hour default window, 150 m radius, 6 AM moon time) live in `lib/config.ts`, each with an `xxx` comment.
- **Unwritten copy and pages** (Terms, Privacy Policy, credits text) contain `xxx` until I write them.
- **On screen:** show `xxx` exactly as it is, in every environment, for now. Before the pilot I'll decide the public wording for unknowns (e.g. "Cost not listed"). The Under $20 filter treats `xxx` and guessed prices as unknown and leaves them out.
- When I replace an `xxx`, nothing else should need to change.

## Screens (see `design/`)
`design/screens/pilot/` are the screens for the pilot; `design/screens/later/` are for after it. `design/source/` holds the HTML mockups (they need a design runtime to render, so read them for layout, copy and tokens, and look at the PNGs to see them).

**Pilot scope:** Onboarding · Discover (list with This week / Under $20 / All filters, map view, cards expand in place) · gathering details + I'm here · check-in moment · Moon (next morning: word, line, photo) · Your Sky (Sky + Moons tabs; tap a sun → its planets) · Planet detail · Sun Road · Settings (account: name, email, birthday; privacy policy; terms; sign out; delete account) · Plan it (.ics with two reminders).

Known gaps in `design/`: the check-in moment and the center nav button still show the old QR/scan idea; build the location "I'm here" flow above instead. Bottom nav for the pilot: Discover · I'm here (center) · Your Sky · Sun Road. Rooms comes later.

## Design tokens
- Background `#0E1024`, surface `#181B36`, surface-2 `#22264A`, border `#3A3F6E`
- Text `#F5F0E6`, muted `#B3B0C7`
- Sun `#FFC23A`, sun-light `#FFD873`, brand red `#E8452C`, ink `#1A1410`, moon `#E9E4D6`
- Planet / art-form colors: `#7FB2FF`, `#FF8F6B`, `#9BE3B8`, `#C9A7FF`
- Fonts (Google Fonts via next/font): Bricolage Grotesque (display, 700/800), DM Sans (body, 400/500/700)
- Radii: cards 22px, pills 18–28px. Touch targets at least 44px. Text contrast at least 4.5:1. Respect reduced motion.
- Sun mark (SVG, viewBox 0 0 100 100): polygon points `50.0,3.9 57.6,21.7 73.9,8.6 70.4,29.6 90.9,26.4 79.3,42.2 94.8,50.0 80.0,58.0 88.7,72.3 71.7,71.7 72.4,88.8 57.5,78.0 50.0,96.6 41.6,81.5 27.4,89.1 29.1,70.9 8.7,73.8 17.9,58.6 2.6,50.0 20.6,42.1 7.2,25.3 29.7,29.7 25.6,7.7 42.2,21.1`, fill sun, stroke ink 3, round joins; eyes at (42,44) and (58,44) r 2.8; smile `M38 55 Q50 66 62 55`.
- Badge icons (24×24, stroke): first `M12 3 L13.8 10.2 L21 12 L13.8 13.8 L12 21 L10.2 13.8 L3 12 L10.2 10.2 Z` · dawn `M3 17 H21 M7 17 A5 5 0 0 1 17 17 M12 6 V8 M5.6 9.6 L7 11 M18.4 9.6 L17 11` · radiant `M12 9 A3 3 0 1 1 12 15 A3 3 0 1 1 12 9 Z M12 2 V5 M12 19 V22 M2 12 H5 M19 12 H22 M4.9 4.9 L7 7 M17 17 L19.1 19.1 M4.9 19.1 L7 17 M17 7 L19.1 4.9` · zenith `M3 20 Q12 0 21 20 M12 7 A2.5 2.5 0 1 1 12 12 A2.5 2.5 0 1 1 12 7 Z` · galaxy `M12 12 m-1 0 a1 1 0 1 1 2 0 a2.5 2.5 0 1 1 -4 1.5 a4.5 4.5 0 1 1 7.5 -3.5 a6.5 6.5 0 1 1 -10.5 6`
- UI voice: short and direct. No helper text floating around screens.

## Milestones
1. **Hello, sun**: done and live on Vercel.
2. **The pilot build (one milestone, built in checkpoints)**: real data and accounts from the start. Supabase schema + RLS, email-code sign-in (Resend), the 28 gatherings and their sessions, onboarding, Discover, gathering details, I'm here (with the dev panel for testing away from venues), check-in moment, Moon (word, line, photo), Your Sky, Planet, Sun Road, Settings (account, sign out, delete account), Plan it (.ics), Terms/Privacy/credits pages (`xxx` until written), production deploy. I'm the tester. Stop at each checkpoint so I can test, review and commit:
   1. Supabase project, schema, RLS, data import and sessions
   2. Sign-in and onboarding
   3. Discover and gathering details
   4. I'm here, the check-in moment and moons
   5. Your Sky, Planet and Sun Road
   6. Settings, Plan it, legal pages, deploy
3. **Pilot** with one weekly host for 4–6 weeks. The host gets a weekly email I write from a SQL query (check-ins, first visits, returns). No host dashboard yet.

## Later (not now)
Rooms (each gathering's conversation; posting needs a sun there) · profile pages, follows, glow · host view and claim-your-gathering · QR check-in · glimmers (everyday moments) · Solstice recap and seasonal skies · Stripe ticketing and multi-night passes · App Store / Google Play via Capacitor · zodiac icons.

## Privacy and safety
- 18+ only. Birthday private. Location never stored. Moons and their photos private.
- Users can delete their account and data from Settings.
- Privacy policy and terms linked in onboarding and Settings.
- Credit d3-celestial for the constellation data.
