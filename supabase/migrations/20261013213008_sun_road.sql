-- Checkpoint 5: the Sun Road. Steps and badges are computed from your check-ins, never stored.

-- my_checkins gains `step`: this check-in's place on your Sun Road (every check-in is one step),
-- in the same order as planet numbers (by session start). New columns go at the end.
create or replace view public.my_checkins
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
  m.photo_path as moon_photo_path,
  (row_number() over (partition by c.user_id order by s.starts_at, c.created_at))::int as step
from public.checkins c
join public.sessions s on s.id = c.session_id
join public.gatherings g on g.id = s.gathering_id
left join public.moons m on m.checkin_id = c.id;

-- One row per badge (CLAUDE.md, Sun Road). A badge is earned on the first check-in where you
-- have reached its step AND finished its challenge. "Place" means a gathering.
--   First Light  step 1   no challenge
--   Dawn         step 5   2 nights at one gathering (come back once)
--   Radiant      step 10  suns in 3 art forms
--   Zenith       step 25  5 nights at one gathering
--   Galaxy       step 50  suns at 8 different gatherings
-- Runs as the caller, so my_checkins (and Row Level Security) limit it to your own check-ins.
create function public.my_sun_road()
returns table (
  badge text,
  step int,              -- the badge's place on the road
  goal int,              -- what the challenge counts up to
  progress int,          -- how far you are now (capped at goal)
  reached boolean,       -- your steps >= the badge's step
  challenge_done boolean,
  earned_at timestamptz, -- when both became true (null = not earned)
  earned_checkin_id uuid,
  nights int             -- your total steps (the same on every row)
)
language sql
stable
set search_path = ''
as $$
  with mine as (
    select * from public.my_checkins
  ),
  first_art as (
    -- the first sun in each art form
    select distinct on (art_form) id
    from mine
    where planet_number = 1 and kind = 'recurring'
    order by art_form, step
  ),
  running as (
    -- after each check-in, in road order: how far each challenge has got
    select
      m.id,
      m.step,
      m.starts_at,
      max(m.planet_number) over w as most_nights,
      sum(case when m.planet_number = 1 and m.kind = 'recurring' then 1 else 0 end) over w as suns,
      sum(case when f.id is not null then 1 else 0 end) over w as art_forms
    from mine m
    left join first_art f on f.id = m.id
    window w as (order by m.step rows between unbounded preceding and current row)
  ),
  badges (badge, step, goal) as (
    values ('First Light', 1, 1), ('Dawn', 5, 2), ('Radiant', 10, 3), ('Zenith', 25, 5), ('Galaxy', 50, 8)
  ),
  scored as (
    select
      b.badge,
      b.step as badge_step,
      b.goal,
      r.id,
      r.step,
      r.starts_at,
      case b.badge
        when 'First Light' then 1
        when 'Dawn' then r.most_nights
        when 'Radiant' then r.art_forms
        when 'Zenith' then r.most_nights
        else r.suns
      end::int as value
    from badges b
    cross join running r
  ),
  latest as (
    select distinct on (badge) badge, step, value from scored order by badge, step desc
  ),
  earned as (
    select distinct on (badge) badge, id, starts_at
    from scored
    where step >= badge_step and value >= goal
    order by badge, step
  )
  select
    b.badge,
    b.step,
    b.goal,
    least(coalesce(l.value, 0), b.goal)::int as progress,
    coalesce(l.step, 0) >= b.step as reached,
    coalesce(l.value, 0) >= b.goal as challenge_done,
    e.starts_at as earned_at,
    e.id as earned_checkin_id,
    coalesce((select max(step) from mine), 0)::int as nights
  from badges b
  left join latest l on l.badge = b.badge
  left join earned e on e.badge = b.badge
  order by b.step;
$$;

revoke execute on function public.my_sun_road from public, anon;
grant execute on function public.my_sun_road to authenticated;
