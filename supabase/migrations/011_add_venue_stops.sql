-- ============================================================
-- Adventure Calendar — add venue_stops to challenges
-- Stores structured multi-stop adventure data as JSONB so the
-- detail page can render each stop as a card without extra queries
-- ============================================================

alter table challenges
  add column if not exists venue_stops jsonb default '[]'::jsonb;

-- venue_stops shape (array of VenueStop objects):
-- [
--   {
--     "order":          1,
--     "venue_name":     "Bar Lunatico",
--     "venue_address":  "486 Halsey St, Brooklyn, NY 11233",
--     "venue_type":     "Bar",
--     "what_to_do":     "Order the house mezcal cocktail and grab a stool at the bar...",
--     "google_rating":  4.6,
--     "review_count":   312,
--     "price_level":    "$$",
--     "tip":            "Gets crowded after 9pm — aim for early evening"
--   },
--   ...
-- ]

comment on column challenges.venue_stops is
  'JSONB array of VenueStop objects — each stop has name, address, type, rating, what_to_do, tip';
