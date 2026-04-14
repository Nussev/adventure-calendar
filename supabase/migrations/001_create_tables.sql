-- ============================================================
-- Adventure Calendar — initial schema
-- Run this in the Supabase SQL editor (Database > SQL editor)
-- ============================================================

-- ── profiles ────────────────────────────────────────────────
-- Extends auth.users; one row per registered user.
create table if not exists profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    text unique,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- Auto-create a profile row whenever a new user signs up
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id)
  values (new.id)
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ── challenges ──────────────────────────────────────────────
-- The 30 pre-defined challenge definitions.
create table if not exists challenges (
  id             uuid primary key default gen_random_uuid(),
  day_number     int  not null unique check (day_number between 1 and 30),
  title          text not null,
  description    text not null,
  duration       text not null,   -- e.g. "1–2 hrs"
  cost_estimate  text not null,   -- e.g. "$5–15"
  category       text not null,   -- e.g. "Food & Culture"
  difficulty     text not null default 'medium'
                   check (difficulty in ('easy', 'medium', 'hard')),
  ai_generated   boolean not null default false,
  created_at     timestamptz not null default now()
);

-- ── user_progress ────────────────────────────────────────────
-- Tracks which challenges a user has completed or skipped.
create table if not exists user_progress (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles (id) on delete cascade,
  challenge_id  uuid not null references challenges (id),
  day_number    int  not null,
  completed_at  timestamptz,           -- null = not yet completed
  skipped       boolean not null default false,
  notes         text,                  -- optional user reflection
  created_at    timestamptz not null default now(),
  unique (user_id, day_number)
);

-- ── Row Level Security ───────────────────────────────────────

alter table profiles      enable row level security;
alter table challenges    enable row level security;
alter table user_progress enable row level security;

-- Challenges are public read
create policy "challenges: public read"
  on challenges for select
  using (true);

-- Profiles: users can only read/update their own
create policy "profiles: own read"
  on profiles for select
  using (auth.uid() = id);

create policy "profiles: own update"
  on profiles for update
  using (auth.uid() = id);

-- Progress: users can only read/write their own rows
create policy "user_progress: own read"
  on user_progress for select
  using (auth.uid() = user_id);

create policy "user_progress: own insert"
  on user_progress for insert
  with check (auth.uid() = user_id);

create policy "user_progress: own update"
  on user_progress for update
  using (auth.uid() = user_id);
