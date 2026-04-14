-- ============================================================
-- Adventure Calendar — align challenges columns with app types
-- ============================================================

alter table challenges
  rename column duration      to estimated_duration;

alter table challenges
  rename column cost_estimate to estimated_cost;

alter table challenges
  add column if not exists time_of_day      text,
  add column if not exists venue_suggestion text;
