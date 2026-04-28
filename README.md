# Adventure Calendar

A full-stack AI-powered app that generates a personalized daily city adventure — real venues, specific things to do, and a 30-day calendar to track your progress. Every day unlocks a new challenge tailored to your neighborhood, interests, budget, and schedule.

> Built as a portfolio project to explore AI product development with Next.js, Supabase, and the Anthropic API.

**[Live Demo →](https://adventure-calendar.vercel.app)** *(coming soon)*

---

## What It Does

You set up your profile once — city, neighborhood, interests, budget, when you're free. Every day, the app generates a unique multi-stop adventure using Claude AI and real venue data from Google Places. Complete today's challenge to unlock tomorrow's.

---

## Features

- **AI-generated adventures** — Claude (Haiku) builds personalized 2–3 stop itineraries with specific things to order, see, or do at each venue
- **Real venue data** — Google Places API surfaces actual ratings, addresses, and pricing for every stop
- **Personalized to you** — challenges factor in your neighborhood, activity interests, budget, time of day availability, and max duration
- **30-day calendar** — locked/unlocked grid with streak tracking and completion history
- **Force re-roll** — don't like today's challenge? Roll a fresh one (rate-limited to 5/day)
- **Badge system** — milestone and category badges earned as you complete challenges
- **AI neighborhood suggestions** — Claude suggests neighborhoods in your city based on your preferences
- **GitHub OAuth** — one-click sign-in via Supabase Auth
- **Dark mode** — system-aware theme with manual toggle
- **Rate limiting** — per-user API call limits with retry-after headers to control Anthropic spend

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, Server Components, Route Handlers) |
| Styling | Tailwind CSS |
| Database + Auth | Supabase (Postgres, RLS, GitHub OAuth) |
| AI / LLM | Anthropic Claude Haiku via `@anthropic-ai/sdk` |
| Venue Data | Google Places API |
| Hosting | Vercel |

---

## Project Structure

```
app/
├── page.tsx                              # Home — calendar grid + today's challenge
├── onboarding/page.tsx                   # First-run preferences flow
├── challenge/[day]/page.tsx             # Challenge detail — stops, tips, complete
├── profile/page.tsx                      # Edit preferences, sign out
├── badges/page.tsx                       # Badge collection view
├── login/page.tsx                        # GitHub OAuth entry point
└── api/
    ├── generate-challenge/route.ts       # AI challenge generation + DB caching
    ├── complete-challenge/route.ts       # Mark done, persist completion
    ├── user-progress/route.ts            # Fetch streak + badge data
    └── neighborhood-suggestions/route.ts # AI neighborhood recommender

components/
├── CalendarGrid.tsx                      # 30-day lock/unlock grid
├── DailyChallengeSection.tsx            # Today's challenge card
├── ChallengeCard.tsx                     # Individual day card
├── BottomNav.tsx                         # Mobile nav bar
└── ThemeProvider.tsx / ThemeToggle.tsx   # Dark mode

lib/
├── getDailyChallenge.ts                  # Challenge fetch + cache logic
├── googlePlaces.ts                       # Google Places venue search
├── rateLimit.tsx                         # Per-user rate limiting (Supabase-backed)
├── supabase.tsx                          # Browser Supabase client
└── supabase-server.tsx                   # SSR Supabase client (cookie-based)
```

---

## How the AI Challenge Generation Works

1. User profile is fetched from Supabase (city, interests, budget, times, etc.)
2. Recent completed challenges are pulled to avoid repeating venue types or activity styles
3. Google Places is queried for real venues matching the user's preferred types
4. A prompt is built combining profile preferences, venue data, and history, then sent to Claude Haiku
5. Claude returns a structured JSON itinerary — title, description, 2–3 venue stops each with specific actions and a tip
6. Real Google Places metadata (rating, address, price level) is matched back onto Claude's venue picks
7. The result is saved to Supabase and cached — the same date always returns the same challenge unless force re-rolled

---

## Getting Started

### Prerequisites

- Node.js 18+
- [Supabase](https://supabase.com) project with GitHub OAuth enabled
- [Anthropic](https://console.anthropic.com) API key
- [Google Places API](https://developers.google.com/maps/documentation/places/web-service) key

### Install

```bash
git clone https://github.com/Nussev/adventure-calendar.git
cd adventure-calendar
npm install
```

### Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
ANTHROPIC_API_KEY=your_anthropic_api_key
GOOGLE_PLACES_API_KEY=your_google_places_api_key
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Author

**Evan Nuss**
[GitHub](https://github.com/Nussev) · [LinkedIn](https://linkedin.com/in/evannuss)

---

## License

MIT
