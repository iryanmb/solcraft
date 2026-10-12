# Solcraft

Solcraft helps people discover shared cultural and creative experiences in their city, show up, and keep coming back. Mobile-first web app (works in any phone browser; installable to the Home Screen). Pilot city: Atlanta.

## How I want to work
- I'm learning Git, JavaScript/TypeScript and React. Before big changes, show a plan and explain the why in plain language.
- Explain each command before running it and each important file when it's created.
- One small feature per step. After each step: what changed, which files, and one small edit for me to make myself.
- Never invent event facts (dates, prices, "beginner-friendly", accessibility). Use clearly marked placeholders.
- Never commit secrets. Keys live in `.env.local`, which is git-ignored.
- Keep a short DECISIONS.md (choice, reason, tradeoff).

## Stack
- Next.js (App Router) + TypeScript
- Plain CSS with CSS variables for design tokens (no UI component libraries)
- Supabase: Postgres, Auth (anonymous sign-in first, email link to keep your sky), Row Level Security, Storage (voice notes, later)
- Vercel for hosting, deploys from GitHub
- Web app manifest so it can be added to the Home Screen; push notifications later

## The world (product vocabulary)
- **Sun**: your first check-in at a recurring gathering. One sun per gathering.
- **Planet**: every check-in at a recurring gathering (including the first). Planets orbit that gathering's sun.
- **Moon**: an optional, private reflection on one planet. One tap = a word (Moved, Joyful, Inspired, Calm, Curious, Not for me); optional line, voice note, saved artist.
- **Comet**: a check-in at a one-time event.
- **Constellation**: two or more suns in the same art form, connected.
- **Your Sky**: the profile that draws all of the above.
- **Solstice**: recap on Jun 21 and Dec 21.
- **Sun Road**: vertical road from sun 1 to 50, to scale (one step per sun). Only suns move you forward.
- **Badges** (the only achievements; shown on the road and later on the profile): First Light (sun 1), Dawn (sun 5 + bring a friend to their first sun, or Find a Twin), Radiant (sun 10 + suns in 3 art forms), Zenith (sun 25 + 5 visits to one place), Galaxy (sun 50 + bring 3 friends).
- **Astrology**: birthday only, optional, used for the first few suggestions and a "Sun in Leo" label. Sign = lookup table from month/day. Behavior overrides it after a few suns.

## Data model (derive, don't duplicate)
- `profiles` (id = auth user id, display_name, birthday nullable, created_at)
- `hosts` (id, name, contact)
- `venues` (id, name, address, neighborhood, lat, lng)
- `gatherings` (id, host_id, venue_id, title, art_form, kind: 'recurring' | 'one_time', description, participation, solo_friendly: 'yes' | 'no' | 'unknown', cost_text, source_url, last_verified_at, status: 'draft' | 'published')
- `sessions` (id, gathering_id, starts_at, ends_at, status: 'scheduled' | 'cancelled', checkin_secret)
- `checkins` (id, user_id, session_id, invited_by nullable, created_at, UNIQUE(user_id, session_id))
- `moons` (id, checkin_id UNIQUE, word, note nullable, created_at). Owner-only via RLS.
- Suns, planets, comets, constellations and achievements are computed from `checkins` (SQL views or server functions), never stored as separate counters.

## Check-in rules
- QR opens `/c/[sessionId]?t=[token]`. Server verifies the token and that now is within the session window (1 hour before start to 1 hour after end).
- First-time visitors are signed in anonymously; no form at the door. Check-in takes under 10 seconds.
- Retries or double taps never create duplicate check-ins (the UNIQUE constraint + upsert).
- After check-in: the sun/planet moment, then "Phone away. Enjoy the room."

## Design tokens
- Background `#0E1024`, surface `#181B36`, surface-2 `#22264A`, border `#3A3F6E`
- Text `#F5F0E6`, muted `#B3B0C7`
- Sun `#FFC23A`, sun-light `#FFD873`, brand red `#E8452C`, ink `#1A1410`, moon `#E9E4D6`
- Planet colors: `#7FB2FF`, `#FF8F6B`, `#9BE3B8`, `#C9A7FF`
- Fonts (Google Fonts): Bricolage Grotesque (display, 700/800), DM Sans (body, 400/500/700)
- Radii: cards 22px, pills 18–28px. Touch targets at least 44px. Respect reduced motion.
- Sun mark (SVG, viewBox 0 0 100 100): polygon points `50.0,3.9 57.6,21.7 73.9,8.6 70.4,29.6 90.9,26.4 79.3,42.2 94.8,50.0 80.0,58.0 88.7,72.3 71.7,71.7 72.4,88.8 57.5,78.0 50.0,96.6 41.6,81.5 27.4,89.1 29.1,70.9 8.7,73.8 17.9,58.6 2.6,50.0 20.6,42.1 7.2,25.3 29.7,29.7 25.6,7.7 42.2,21.1`, fill sun, stroke ink 3, round joins; eyes at (42,44) and (58,44) r 2.8; smile `M38 55 Q50 66 62 55`.
- Screen references: `design/` folder (screenshots from the Solcraft Screens canvas).

## Social (version 1)
- Hevy-style one-way follow. Profiles are private by default (you approve followers); you can switch to public.
- Friends feed shows: new suns and badges earned. Posts appear only after the event's end time. Never live location, never plans.
- One reaction: a "glow", with no public counts. No comments, no chat.
- Moons are always private unless the user shares a single line.
- Not in version 1: Find a Twin, regulars as guides, "met someone?", going out together, star clusters.

## Screens (see `design/`)
Discover (filters: This week, Under $20, All, with counts; map view; cards expand in place) · Your Sky (Sky and Moons tabs; sun count opens the Sun Road; "Back this week" panel; tap a sun for its planets) · Sun Road (vertical, bottom to top, 1 to 50, one step per sun, 5 badges, 2 first-time tips) · Profile (avatar sun, badges, constellations, Twin Suns later) · Check-in · Moon (one word + optional line) · Solstice recap.
The files in `design/` are reference mockups (HTML/CSS). Match their layout, tokens and copy; don't copy their runtime code.

## Milestones (each ends with something deployed)
1. **Hello, sun**: Next.js app on Vercel showing the sun mark and tokens.
2. **The app on sample data**: Discover, Your Sky (a data-driven SVG component) and the Sun Road, all reading from a local JSON of sample events and check-ins. No database yet.
3. **Real data**: Supabase schema + RLS, the verified Atlanta gatherings, anonymous sign-in, the QR check-in route that creates suns and planets.
4. **Moons + Plan it**: the next-morning moon card (shown on next open); "Plan it" downloads an .ics with two reminders.
5. **Host view**: create sessions, print the QR, see check-ins, first visits and returns (labeled as what Solcraft observed).
6. **Pilot** with one weekly host for 4–6 weeks.
7. **Profile + friends feed** (Social, above), opened to pilot users and their friends.
