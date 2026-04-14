-- ============================================================
-- Adventure Calendar — seed 30 challenges
-- Safe to re-run (uses ON CONFLICT DO NOTHING)
-- ============================================================

insert into challenges (day_number, title, description, duration, cost_estimate, category, difficulty)
values
  (1,  'Morning Market Run',
       'Head to your local farmers market and try one food you have never eaten before. Talk to a vendor and learn where it comes from.',
       '1–2 hrs', '$5–15', 'Food & Culture', 'easy'),

  (2,  'Sunrise Hike',
       'Find a trail within 30 minutes of home and hike to a viewpoint in time for sunrise. No phone — just the view.',
       '2–3 hrs', '$0', 'Outdoors', 'medium'),

  (3,  'Cuisine Roulette',
       'Pick a cuisine you have never cooked before. Buy the ingredients and make it from scratch using only one online recipe.',
       '2 hrs', '$15–25', 'Food & Culture', 'medium'),

  (4,  'Letter to Future You',
       'Write a letter to yourself to be opened in one year. Be honest about where you are right now. Seal it and set a calendar reminder.',
       '45 mins', '$0', 'Mindfulness', 'easy'),

  (5,  'Stranger Conversation',
       'Have a genuine 10-minute conversation with someone you have never met — a cafe regular, a shop owner, a park bench neighbor.',
       '30 mins', '$0–5', 'Social', 'medium'),

  (6,  'Learn a Magic Trick',
       'Pick one card trick on YouTube, drill it until you can do it smoothly, then perform it for at least two people today.',
       '2 hrs', '$0', 'Skills', 'easy'),

  (7,  'Cold Plunge',
       'End your shower with 2 full minutes of cold water. Focus on your breathing. Notice what shifts afterward.',
       '15 mins', '$0', 'Wellness', 'hard'),

  (8,  'Museum Stranger',
       'Visit a museum or gallery you have never been to. Spend at least 20 minutes in front of one single exhibit.',
       '2–3 hrs', '$0–20', 'Culture', 'easy'),

  (9,  'Two Hours of Volunteering',
       'Find a local organization and show up to help for two hours. Food bank, trail cleanup, animal shelter — whatever fits.',
       '2–3 hrs', '$0', 'Community', 'medium'),

  (10, 'Try a New Sport',
       'Find a court, field, or gym and learn the basics of a sport you have never played. Ask someone there to show you the ropes.',
       '1–2 hrs', '$0–15', 'Fitness', 'medium'),

  (11, 'Analog Day',
       'Leave your phone at home for the entire day. Navigate by memory, occupy your time without a screen, notice what you miss.',
       'Full day', '$0', 'Mindfulness', 'hard'),

  (12, 'Sunset Picnic',
       'Pack whatever is in your fridge into a bag, find the best outdoor spot near you, and watch the full sunset without leaving early.',
       '1–2 hrs', '$0–10', 'Outdoors', 'easy'),

  (13, 'Teach Someone Something',
       'Pick a skill you have that someone in your life does not — cooking technique, knot tying, a language phrase, anything. Teach it properly.',
       '1 hr', '$0', 'Social', 'easy'),

  (14, 'New Neighborhood Walk',
       'Pick a neighborhood in your city you have never walked through. Walk for 90 minutes with no destination. Take one photo that surprises you.',
       '90 mins', '$0', 'Exploration', 'easy'),

  (15, 'Make Something with Your Hands',
       'Build, craft, draw, or sculpt something physical from materials you already own. The output does not need to be good — it needs to exist.',
       '2–3 hrs', '$0–10', 'Creativity', 'medium'),

  (16, 'Stargazing Session',
       'Drive or walk to the darkest spot you can find. Lie on your back and look at the sky for 30 uninterrupted minutes.',
       '1–2 hrs', '$0', 'Outdoors', 'easy'),

  (17, 'Random Act of Kindness',
       'Do something kind for a stranger today — pay for their coffee, leave an encouraging note for a neighbor, carry something heavy.',
       '30 mins', '$0–10', 'Community', 'easy'),

  (18, 'Live Music or Performance',
       'Find something live happening today — open mic, street performer, local band, comedy show — and stay for the whole thing.',
       '2–3 hrs', '$0–20', 'Culture', 'medium'),

  (19, 'New Workout',
       'Try a workout format you have never done: yoga class, bouldering gym, dance class, kettlebell session. Show up as a beginner.',
       '1–2 hrs', '$0–20', 'Fitness', 'medium'),

  (20, 'Call Someone You Miss',
       'Call — not text — someone you have not spoken to in over a year. No agenda. Just catch up.',
       '30–60 mins', '$0', 'Social', 'medium'),

  (21, 'Plant Something',
       'Buy a plant, some seeds, or a cutting and get it in soil today. Put it somewhere you will see it every morning.',
       '1 hr', '$5–15', 'Mindfulness', 'easy'),

  (22, 'Find the Best View',
       'Find the highest or most scenic viewpoint in your city or town. Go at golden hour. Bring nothing but yourself.',
       '1–3 hrs', '$0', 'Exploration', 'easy'),

  (23, 'Cook for Someone',
       'Invite someone over and cook them a meal from a recipe you have never made before. Do not order backup.',
       '3 hrs', '$20–40', 'Food & Culture', 'hard'),

  (24, 'Interview an Elder',
       'Ask an older person in your life — grandparent, neighbor, coworker — to tell you about the most important thing they have learned. Listen fully.',
       '1 hr', '$0', 'Social', 'easy'),

  (25, 'Campfire Night',
       'Build a fire legally (backyard, campsite, fire pit). Sit with it until the coals go cold. No phone, just fire.',
       '2–3 hrs', '$0–10', 'Outdoors', 'medium'),

  (26, 'Read for Two Hours',
       'Read a physical book — not your phone — for two uninterrupted hours. If you do not have one, walk to a library or used bookshop.',
       '2 hrs', '$0–10', 'Mindfulness', 'easy'),

  (27, 'Street Photography',
       'Take 20 photos out in the world today. Focus on light, shadow, and small moments. Do not delete any until tonight.',
       '2 hrs', '$0', 'Creativity', 'medium'),

  (28, 'Pantry Challenge',
       'Cook a full meal using only what is already in your home. No grocery run. Get creative with what you find.',
       '1–2 hrs', '$0', 'Food & Culture', 'hard'),

  (29, 'Sunset to Sunrise',
       'Go to bed when the sun sets. No artificial light after dark. Wake with the sun. Notice how you feel the next morning.',
       'Full evening', '$0', 'Wellness', 'hard'),

  (30, 'Create Something to Share',
       'Make something today — a short essay, a song, a painting, a poem — and share it with at least one person. The point is the sharing.',
       '3–4 hrs', '$0–10', 'Creativity', 'hard')

on conflict (day_number) do nothing;
