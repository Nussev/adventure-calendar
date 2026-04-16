-- ============================================================
-- Adventure Calendar — extend challenges for AI generation
-- and add missing profile columns
-- ============================================================

-- ── challenges: support per-user AI-generated entries ────────
-- Remove the old unique constraint on day_number alone so that
-- each user can have their own generated challenge per day.
alter table challenges
  drop constraint if exists challenges_day_number_key;

alter table challenges
  add column if not exists user_id        uuid references profiles (id) on delete cascade,
  add column if not exists generated_at   timestamptz,
  add column if not exists venue_address  text,
  add column if not exists venue_price    text,
  add column if not exists route_tip      text;

-- New unique constraint: one challenge per user per day
-- (pre-seeded rows have user_id = null and remain as defaults)
create unique index if not exists challenges_user_day_idx
  on challenges (user_id, day_number)
  where user_id is not null;

-- ── profiles: add name + city fields ────────────────────────
alter table profiles
  add column if not exists full_name text,
  add column if not exists city      text;
