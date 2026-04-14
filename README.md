# Adventure Calendar

A spontaneous daily challenge app powered by AI. Every day you unlock a new adventure — explore your city, try something new, and earn badges as you go. You can't unlock the next day until you complete today's challenge.

> Built as a full-stack AI portfolio project using Next.js, Supabase, and the Anthropic API.

---

## Live Demo

🔗 [adventure-calendar.vercel.app](https://adventure-calendar.vercel.app) *(coming soon)*

---

## Features

- **30-day adventure calendar** — one AI-generated challenge unlocked per day
- **Personalized challenges** — tailored to your neighborhood, food preferences, activity interests, budget, and availability
- **AI-powered recommendations** — specific venue suggestions, routes, and pricing via the Anthropic API
- **Progress tracking** — streak counter, calendar overview, completion history
- **Badge system** — earn milestone and category badges as you complete challenges
- **User authentication** — secure login and persistent progress via Supabase

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router) |
| Styling | Tailwind CSS |
| Database + Auth | Supabase (Postgres) |
| AI / LLM | Anthropic Claude API |
| Hosting | Vercel |

---

## Project Structure

```
adventure-calendar/
├── app/
│   ├── page.js                        # Home / calendar view
│   ├── onboarding/page.js             # User preferences input
│   ├── challenge/page.js              # Daily challenge detail
│   └── badges/page.js                 # Badge collection
├── app/api/
│   ├── generate-challenge/route.js    # Anthropic API — AI challenge generation
│   ├── complete-challenge/route.js    # Mark challenge done, unlock next day
│   └── user-progress/route.js         # Fetch user progress from Supabase
├── components/                        # Reusable UI components
├── lib/
│   ├── supabase.js                    # Supabase client
│   └── prompts.js                     # AI prompt templates
└── .env.local                         # Environment variables (not committed)
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account and project
- An [Anthropic](https://console.anthropic.com) API key

### Installation

1. Clone the repo
```bash
git clone https://github.com/YOURUSERNAME/adventure-calendar.git
cd adventure-calendar
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables — create a `.env.local` file in the project root:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## Roadmap

- [x] Project setup — Next.js, Supabase, Anthropic API connected
- [ ] Supabase database schema — users, challenges, progress, badges
- [ ] User onboarding — preferences input flow
- [ ] AI challenge generation — Anthropic API integration
- [ ] Calendar UI — 30-day grid with lock/unlock logic
- [ ] Challenge detail page — venue suggestions, routes, pricing
- [ ] Badge system — milestone and category tracking
- [ ] Vercel deployment
- [ ] Mobile-responsive polish
- [ ] Mobile app (Expo) — future

---

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon public key |
| `ANTHROPIC_API_KEY` | Your Anthropic API key (server-side only) |

---

## Author

**Evan Nuss**
[yourportfolio.com](https://yourportfolio.com) · [GitHub](https://github.com/Nussev) · [LinkedIn](https://linkedin.com/in/evannuss)

---

## License

MIT
