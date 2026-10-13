-- Solcraft schema, checkpoint 1. Tables follow the data model in CLAUDE.md.
-- Suns, planets, road steps and badges are not stored: they are computed from checkins later.

-- ---------------------------------------------------------------------------
-- Catalog: hosts, venues, gatherings, sessions. Filled by scripts/import.ts.
-- ---------------------------------------------------------------------------

create table public.hosts (
  id text primary key,          -- readable id made from the name, e.g. 'charis-circle'
  name text not null,
  contact text                  -- not collected yet
);

create table public.venues (
  id text primary key,          -- e.g. 'red-light-cafe'
  name text not null,
  address text not null,        -- 'xxx' when unknown
  lat double precision,         -- null when the address can't be placed on a map
  lng double precision
);

create table public.gatherings (
  id text primary key,          -- e.g. 'wednesday-jazz-jam'
  host_id text not null references public.hosts (id),
  venue_id text not null references public.venues (id),
  title text not null,
  art_form text not null,
  kind text not null check (kind in ('recurring', 'one_time')),
  recurrence_text text not null,
  start_text text not null,     -- CSV wording, e.g. '9:15 PM (doors 8:30)'
  end_text text not null,
  how_you_take_part text not null,
  why_it_fits text not null,
  cost_text text not null,
  age_text text not null,
  source_url text not null,
  last_verified_at date not null,
  status text not null default 'draft' check (status in ('draft', 'published'))
);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  gathering_id text not null references public.gatherings (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz,          -- null when the end time is unknown
  status text not null default 'scheduled' check (status in ('scheduled', 'cancelled')),
  -- Re-running the import updates a session instead of adding a duplicate.
  unique (gathering_id, starts_at),
  check (ends_at is null or ends_at > starts_at)
);

create index sessions_starts_at_idx on public.sessions (starts_at);

-- ---------------------------------------------------------------------------
-- People: profiles, checkins, moons. Each person sees only their own rows.
-- ---------------------------------------------------------------------------

-- Birthday -> sun sign. Same date ranges as data/zodiac-constellations.json
-- (scripts/check-database.ts checks that the two agree).
create function public.sun_sign_for(birthday date)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when md between  120 and  218 then 'Aquarius'
    when md between  219 and  320 then 'Pisces'
    when md between  321 and  419 then 'Aries'
    when md between  420 and  520 then 'Taurus'
    when md between  521 and  620 then 'Gemini'
    when md between  621 and  722 then 'Cancer'
    when md between  723 and  822 then 'Leo'
    when md between  823 and  922 then 'Virgo'
    when md between  923 and 1022 then 'Libra'
    when md between 1023 and 1121 then 'Scorpio'
    when md between 1122 and 1221 then 'Sagittarius'
    else 'Capricorn'              -- Dec 22 to Jan 19 wraps around the new year
  end
  from (select extract(month from birthday)::int * 100 + extract(day from birthday)::int as md) as d
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 1 and 50),
  birthday date not null,
  -- Stored so others can see the sign without seeing the birthday, but always
  -- computed by the database from the birthday, so the two can't disagree.
  sun_sign text generated always as (public.sun_sign_for(birthday)) stored,
  created_at timestamptz not null default now()
);

create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- restrict: a session someone checked in to can't be deleted by a re-import.
  session_id uuid not null references public.sessions (id) on delete restrict,
  method text not null check (method in ('location', 'qr')),
  created_at timestamptz not null default now(),
  -- Retries and double taps never create a second check-in.
  unique (user_id, session_id)
);

create table public.moons (
  id uuid primary key default gen_random_uuid(),
  checkin_id uuid not null unique references public.checkins (id) on delete cascade,
  word text not null check (word in ('Moved', 'Joyful', 'Inspired', 'Calm', 'Curious', 'Not for me')),
  note text,
  photo_path text,              -- path in the private moon-photos bucket (checkpoint 4)
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security: the database decides who can read and write each row.
-- The publishable key is public, so these rules are what protect the data.
-- The secret key (scripts only) skips them.
-- ---------------------------------------------------------------------------

alter table public.hosts      enable row level security;
alter table public.venues     enable row level security;
alter table public.gatherings enable row level security;
alter table public.sessions   enable row level security;
alter table public.profiles   enable row level security;
alter table public.checkins   enable row level security;
alter table public.moons      enable row level security;

-- Table permissions: start from nothing, then allow only what the app needs.
-- (anon = signed out, authenticated = signed in.)
revoke all on public.hosts, public.venues, public.gatherings, public.sessions,
              public.profiles, public.checkins, public.moons
  from anon, authenticated;

grant select on public.hosts, public.venues, public.gatherings, public.sessions to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select on public.checkins to authenticated;  -- check-ins are created by a function in checkpoint 4
grant select, insert, update, delete on public.moons to authenticated;
grant all on public.hosts, public.venues, public.gatherings, public.sessions,
             public.profiles, public.checkins, public.moons
  to service_role;

-- The catalog is public to read. Nobody can change it from the app.
create policy "Anyone can read hosts" on public.hosts
  for select to anon, authenticated using (true);

create policy "Anyone can read venues" on public.venues
  for select to anon, authenticated using (true);

create policy "Anyone can read published gatherings" on public.gatherings
  for select to anon, authenticated using (status = 'published');

create policy "Anyone can read sessions of published gatherings" on public.sessions
  for select to anon, authenticated
  using (exists (
    select 1 from public.gatherings g
    where g.id = gathering_id and g.status = 'published'
  ));

-- Profiles: only the owner, and only adults.
create policy "Read your own profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

create policy "Create your own profile, 18 and older" on public.profiles
  for insert to authenticated
  with check (
    (select auth.uid()) = id
    and birthday <= (current_date - interval '18 years')
  );

create policy "Update your own profile, 18 and older" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check (
    (select auth.uid()) = id
    and birthday <= (current_date - interval '18 years')
  );

-- Check-ins: read your own.
create policy "Read your own check-ins" on public.checkins
  for select to authenticated using ((select auth.uid()) = user_id);

-- Moons: everything on your own, through a check-in you own.
create policy "Read your own moons" on public.moons
  for select to authenticated
  using (exists (
    select 1 from public.checkins c
    where c.id = checkin_id and c.user_id = (select auth.uid())
  ));

create policy "Add a moon to your own check-in" on public.moons
  for insert to authenticated
  with check (exists (
    select 1 from public.checkins c
    where c.id = checkin_id and c.user_id = (select auth.uid())
  ));

create policy "Change your own moons" on public.moons
  for update to authenticated
  using (exists (
    select 1 from public.checkins c
    where c.id = checkin_id and c.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.checkins c
    where c.id = checkin_id and c.user_id = (select auth.uid())
  ));

create policy "Delete your own moons" on public.moons
  for delete to authenticated
  using (exists (
    select 1 from public.checkins c
    where c.id = checkin_id and c.user_id = (select auth.uid())
  ));
