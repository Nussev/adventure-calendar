-- ============================================================
-- Adventure Calendar — add venue type preferences to profiles
-- Lets users express which kinds of places they want challenges at
-- e.g. restaurants, bars, museums, parks, live music venues
-- ============================================================

alter table profiles
  add column if not exists preferred_venue_types text[] default '{}';

-- Also add venue_type to challenges so we can store what kind of
-- venue was suggested (makes filtering / badges easier later)
alter table challenges
  add column if not exists venue_type text;

comment on column profiles.preferred_venue_types is
  'User-selected venue type preferences, e.g. ["Restaurants","Museums","Parks"]';

comment on column challenges.venue_type is
  'The category of venue suggested for this challenge, e.g. "Restaurant", "Museum"';
