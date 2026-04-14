-- ============================================================
-- Adventure Calendar — add rate limiting support to profiles
-- ============================================================

-- Track when a user last triggered an AI generation so we can
-- enforce a once-per-24h limit server-side.
alter table profiles
  add column if not exists last_ai_generated timestamptz;

-- Generic per-user API call log for finer-grained limiting if needed later.
-- Each row = one API call. Old rows can be pruned by a scheduled job.
create table if not exists api_call_log (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references profiles (id) on delete cascade,
  endpoint   text not null,         -- e.g. 'generate-challenge'
  called_at  timestamptz not null default now()
);

create index if not exists api_call_log_user_endpoint_idx
  on api_call_log (user_id, endpoint, called_at desc);

alter table api_call_log enable row level security;

-- Users can only see their own log rows (useful for client-side feedback)
create policy "api_call_log: own read"
  on api_call_log for select
  using (auth.uid() = user_id);

