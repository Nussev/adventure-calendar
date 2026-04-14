-- ============================================================
-- Adventure Calendar — seed badge definitions
-- Safe to re-run (uses ON CONFLICT DO NOTHING)
-- ============================================================

insert into badges (slug, name, description, requirement_type, requirement_value, requirement_meta)
values
  ('first-step',
   'First Step',
   'Complete your very first challenge.',
   'complete_n_days', 1, null),

  ('week-one',
   'Week One',
   'Complete 7 days in a row without breaking your streak.',
   'streak', 7, null),

  ('trailblazer',
   'Trailblazer',
   'Complete 3 Outdoors challenges.',
   'complete_n_in_category', 3, 'Outdoors'),

  ('social-butterfly',
   'Social Butterfly',
   'Complete 3 Social challenges.',
   'complete_n_in_category', 3, 'Social'),

  ('taste-explorer',
   'Taste Explorer',
   'Complete 3 Food & Culture challenges.',
   'complete_n_in_category', 3, 'Food & Culture'),

  ('mind-and-body',
   'Mind & Body',
   'Complete 3 Wellness challenges.',
   'complete_n_in_category', 3, 'Wellness'),

  ('creative-force',
   'Creative Force',
   'Complete 3 Creativity challenges.',
   'complete_n_in_category', 3, 'Creativity'),

  ('iron-will',
   'Iron Will',
   'Complete a Hard difficulty challenge.',
   'difficulty', 1, 'hard'),

  ('halfway-there',
   'Halfway There',
   'Complete 15 days of the calendar.',
   'complete_n_days', 15, null),

  ('community-builder',
   'Community Builder',
   'Complete 3 Community challenges.',
   'complete_n_in_category', 3, 'Community'),

  ('unstoppable',
   'Unstoppable',
   'Complete 7 days without skipping a single one.',
   'streak', 7, 'no_skips'),

  ('full-calendar',
   'Full Calendar',
   'Complete all 30 days. You are the adventure.',
   'complete_n_days', 30, null)

on conflict (slug) do nothing;
