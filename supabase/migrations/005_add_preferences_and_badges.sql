-- ============================================================
-- Adventure Calendar — user preferences + badges schema
-- ============================================================

-- ── Preferences columns on profiles ─────────────────────────
alter table profiles
  add column if not exists display_name         text,
  add column if not exists preferred_categories text[]   default '{}',
  add column if not exists preferred_difficulty text     default 'mixed'
    check (preferred_difficulty in ('easy', 'mixed', 'hard')),
  add column if not exists max_duration         text     default 'flexible',
  add column if not exists onboarding_completed boolean  not null default false;

-- ── Badges ───────────────────────────────────────────────────
-- Badge definitions (static, seeded below in 006)
create table if not exists badges (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique,
  name              text not null,
  description       text not null,
  -- What the badge is tied to: 'complete_n_in_category' | 'complete_n_days'
  -- | 'streak' | 'difficulty' | 'special'
  requirement_type  text not null,
  requirement_value int,            -- e.g. 3 for "complete 3 in category"
  requirement_meta  text,           -- e.g. category name or difficulty level
  created_at        timestamptz not null default now()
);

-- Which users have earned which badges
create table if not exists user_badges (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles (id) on delete cascade,
  badge_id   uuid not null references badges (id),
  earned_at  timestamptz not null default now(),
  unique (user_id, badge_id)
);

alter table badges      enable row level security;
alter table user_badges enable row level security;

-- Badges are public read
create policy "badges: public read"
  on badges for select
  using (true);

-- Users can only see their own earned badges
create policy "user_badges: own read"
  on user_badges for select
  using (auth.uid() = user_id);
