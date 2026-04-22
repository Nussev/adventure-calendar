-- ============================================================
-- Adventure Calendar — reconcile schema with desired spec
-- Adds genuinely missing columns; does not duplicate columns
-- that already exist under different names.
--
-- Column name mapping (existing → desired):
--   profiles.preferred_foods        → food_preferences
--   profiles.preferred_activities   → activity_interests
--   profiles.available_times text[] → availability text (added below)
--   challenges.day_number int       → challenge_date date (added below)
--   challenges.estimated_duration   → estimated_time (added below)
--   user_badges table               → badges (badge_type added below)
-- ============================================================


-- ── 1. profiles.updated_at ───────────────────────────────────
alter table profiles
  add column if not exists updated_at timestamptz not null default now();

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on profiles;
create trigger profiles_updated_at
  before update on profiles
  for each row execute function public.set_updated_at();


-- ── 2. profiles.availability ─────────────────────────────────
-- available_times is text[] (multi-select); availability is a
-- single-value field ('weekdays' | 'weekends' | 'both') for
-- simpler AI prompt construction.
alter table profiles
  add column if not exists availability text
    check (availability in ('weekdays', 'weekends', 'both'));


-- ── 3. challenges.challenge_date ─────────────────────────────
-- day_number (int 1-30) is kept for backward compatibility.
-- challenge_date (date) supports per-user AI challenges keyed
-- to a real calendar date.
alter table challenges
  add column if not exists challenge_date date;

-- Add a date-based unique index alongside the existing day_number one.
-- The existing challenges_user_day_idx (user_id, day_number) is kept as-is
-- so existing upsert(onConflict:'user_id,day_number') calls keep working.
create unique index if not exists challenges_user_date_idx
  on challenges (user_id, challenge_date)
  where user_id is not null and challenge_date is not null;


-- ── 4. challenges.is_completed + completed_at ────────────────
-- Completion is currently tracked in user_progress.  Adding
-- these columns directly to challenges lets single-table queries
-- return full challenge state without a join.
alter table challenges
  add column if not exists is_completed boolean not null default false,
  add column if not exists completed_at timestamptz;


-- ── 5. challenges.estimated_time ─────────────────────────────
-- estimated_duration already exists; estimated_time is the name
-- used by the /api/daily-challenge route response shape.
alter table challenges
  add column if not exists estimated_time text;


-- ── 6. user_badges.badge_type ────────────────────────────────
-- The badges table holds definitions; user_badges records which
-- users earned which badge.  Adding badge_type (text slug) lets
-- callers filter without joining badges.
alter table user_badges
  add column if not exists badge_type text;

-- Backfill badge_type from the badges definition table
update user_badges ub
set    badge_type = b.slug
from   badges b
where  ub.badge_id = b.id
  and  ub.badge_type is null;

-- RLS: allow users to insert their own user_badges rows
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'user_badges' and policyname = 'user_badges: own insert'
  ) then
    execute $policy$
      create policy "user_badges: own insert"
        on user_badges for insert
        with check (auth.uid() = user_id)
    $policy$;
  end if;
end;
$$;
