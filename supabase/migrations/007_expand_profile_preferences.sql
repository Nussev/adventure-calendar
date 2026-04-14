-- ============================================================
-- Adventure Calendar — expand profile preferences
-- Adds columns captured by the onboarding flow
-- ============================================================

alter table profiles
  add column if not exists neighborhood          text,
  add column if not exists max_distance          text,
  add column if not exists preferred_activities  text[]  default '{}',
  add column if not exists preferred_foods       text[]  default '{}',
  add column if not exists available_times       text[]  default '{}',
  add column if not exists budget                text;

-- max_duration already exists from migration 005 — no change needed
-- onboarding_completed already exists from migration 005 — no change needed
