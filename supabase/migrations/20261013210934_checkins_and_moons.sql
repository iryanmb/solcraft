-- Checkpoint 4: the I'm here window, check-ins, testers, moon photos.

-- ---------------------------------------------------------------------------
-- The I'm here window. The ONLY place these numbers live: the app reads
-- opens_at / closes_at from session_windows, and check_in() enforces them.
-- ---------------------------------------------------------------------------

-- xxx: opens 1 hour before the start (confirm before the pilot).
create function public.checkin_opens_at(starts_at timestamptz)
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select starts_at - interval '1 hour'
$$;

-- xxx: closes 1 hour after the end; with no end time, 4 hours after the start (confirm before the pilot).
create function public.checkin_closes_at(starts_at timestamptz, ends_at timestamptz)
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select case when ends_at is null then starts_at + interval '4 hours' else ends_at + interval '1 hour' end
$$;

-- Sessions plus their window. security_invoker: it follows the sessions table's RLS.
create view public.session_windows
with (security_invoker = true)
as
select
  s.id,
  s.gathering_id,
  s.starts_at,
  s.ends_at,
  s.status,
  public.checkin_opens_at(s.starts_at) as opens_at,
  public.checkin_closes_at(s.starts_at, s.ends_at) as closes_at
from public.sessions s;

grant select on public.session_windows to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Testers: only they may "pretend" in the dev panel. Off for everyone; switch
-- it on for your own account in the Table Editor. Nobody can set it from the app.
-- ---------------------------------------------------------------------------

alter table public.profiles add column is_tester boolean not null default false;

revoke insert, update on public.profiles from authenticated;
grant insert (id, display_name, birthday) on public.profiles to authenticated;
grant update (display_name, birthday) on public.profiles to authenticated;

-- A moon's line stays short.
alter table public.moons add constraint moons_note_length check (note is null or char_length(note) <= 280);

-- ---------------------------------------------------------------------------
-- Your check-ins, numbered. Planet 1 at a gathering is its sun.
-- Computed here, never stored (CLAUDE.md: derive, don't duplicate).
-- ---------------------------------------------------------------------------

create view public.my_checkins
with (security_invoker = true)
as
select
  c.id,
  c.session_id,
  c.created_at,
  s.starts_at,
  s.ends_at,
  g.id as gathering_id,
  g.title,
  g.art_form,
  g.kind,
  g.venue_id,
  (row_number() over (partition by c.user_id, g.id order by s.starts_at, c.created_at))::int as planet_number,
  m.word as moon_word,
  m.note as moon_note,
  m.photo_path as moon_photo_path
from public.checkins c
join public.sessions s on s.id = c.session_id
join public.gatherings g on g.id = s.gathering_id
left join public.moons m on m.checkin_id = c.id;

grant select on public.my_checkins to authenticated;

-- ---------------------------------------------------------------------------
-- check_in(): the only way to create a check-in. It checks the window and the
-- distance to the venue. The coordinates are used for the check and then
-- discarded: they are never written anywhere.
-- Errors start with "solcraft:" so the app can show the right message.
-- ---------------------------------------------------------------------------

create function public.check_in(
  p_session_id uuid,
  p_lat double precision default null,
  p_lng double precision default null,
  p_accuracy double precision default null,
  p_pretend_place boolean default false,
  p_pretend_time boolean default false
)
returns table (checkin_id uuid, is_new boolean, planet_number int, sun_count int)
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  sess record;
  tester boolean;
  meters double precision;
  -- xxx: 150 m from the venue, plus up to 100 m for the phone's reported accuracy (confirm at a real venue).
  radius constant double precision := 150;
  max_leeway constant double precision := 100;
begin
  if uid is null then
    raise exception 'solcraft:signed_out';
  end if;

  select p.is_tester into tester from public.profiles p where p.id = uid;
  if not found then
    raise exception 'solcraft:no_profile';
  end if;
  if (p_pretend_place or p_pretend_time) and not tester then
    raise exception 'solcraft:not_tester';
  end if;

  select w.id, w.gathering_id, w.starts_at, w.opens_at, w.closes_at, v.lat, v.lng
    into sess
    from public.session_windows w
    join public.gatherings g on g.id = w.gathering_id and g.status = 'published'
    join public.venues v on v.id = g.venue_id
   where w.id = p_session_id and w.status = 'scheduled';
  if not found then
    raise exception 'solcraft:no_session';
  end if;

  if not p_pretend_time and now() not between sess.opens_at and sess.closes_at then
    raise exception 'solcraft:window';
  end if;

  if not p_pretend_place then
    if sess.lat is null or sess.lng is null then
      raise exception 'solcraft:no_venue_location';
    end if;
    if p_lat is null or p_lng is null then
      raise exception 'solcraft:location';
    end if;
    -- Distance on the Earth's surface (haversine), in meters.
    meters := 2 * 6371000 * asin(sqrt(
      power(sin(radians(sess.lat - p_lat) / 2), 2)
      + cos(radians(p_lat)) * cos(radians(sess.lat)) * power(sin(radians(sess.lng - p_lng) / 2), 2)
    ));
    if meters > radius + least(greatest(coalesce(p_accuracy, 0), 0), max_leeway) then
      raise exception 'solcraft:location';
    end if;
  end if;

  -- A retry or double tap finds the existing check-in instead of making a second one.
  insert into public.checkins (user_id, session_id, method)
  values (uid, p_session_id, 'location')
  on conflict (user_id, session_id) do nothing
  returning id into checkin_id;

  is_new := checkin_id is not null;
  if not is_new then
    select c.id into checkin_id from public.checkins c where c.user_id = uid and c.session_id = p_session_id;
  end if;

  -- Same numbering as my_checkins: this night's place among your nights at this gathering.
  select count(*)::int into planet_number
    from public.checkins c
    join public.sessions s on s.id = c.session_id
   where c.user_id = uid and s.gathering_id = sess.gathering_id and s.starts_at <= sess.starts_at;

  select count(distinct s.gathering_id)::int into sun_count
    from public.checkins c
    join public.sessions s on s.id = c.session_id
    join public.gatherings g on g.id = s.gathering_id and g.kind = 'recurring'
   where c.user_id = uid;

  return next;
end;
$$;

revoke execute on function public.check_in from public, anon;
grant execute on function public.check_in to authenticated;

-- Testers only: delete all your check-ins (and their moons) to test a first sun again.
create function public.dev_delete_my_checkins()
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted int;
begin
  if not coalesce((select p.is_tester from public.profiles p where p.id = auth.uid()), false) then
    raise exception 'solcraft:not_tester';
  end if;
  delete from public.checkins c where c.user_id = auth.uid();
  get diagnostics deleted = row_count;
  return deleted;
end;
$$;

revoke execute on function public.dev_delete_my_checkins from public, anon;
grant execute on function public.dev_delete_my_checkins to authenticated;

-- ---------------------------------------------------------------------------
-- Moon photos: a private bucket. Each person's files sit in a folder named
-- after their user id, and only they can read or change them.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('moon-photos', 'moon-photos', false, 5242880, array['image/jpeg']);

create policy "Moon photos: read your own" on storage.objects
  for select to authenticated
  using (bucket_id = 'moon-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Moon photos: add your own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'moon-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Moon photos: replace your own" on storage.objects
  for update to authenticated
  using (bucket_id = 'moon-photos' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'moon-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Moon photos: delete your own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'moon-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
