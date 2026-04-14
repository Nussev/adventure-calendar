-- ============================================================
-- Adventure Calendar — add session_id to api_call_log
-- ============================================================
-- Supabase Auth JWTs carry a session_id claim. Storing it here
-- lets us do per-session rate limiting, multi-device detection,
-- and session-scoped query traces for debugging/analytics.

alter table api_call_log
  add column if not exists session_id uuid;

-- Index for session-scoped lookups
create index if not exists api_call_log_session_idx
  on api_call_log (session_id, called_at desc);
