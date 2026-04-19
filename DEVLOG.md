## April 13 2026

### Session start
- Phase 1 complete — Next.js, Supabase, Anthropic configured
- GitHub repo live: github.com/Nussev/adventure-calendar
- First commit pushed
- Claude Code installed
- Starting Phase 2: home page + calendar grid UI

### Home page + UI (Phase 2)
- Built `app/page.tsx`, `components/CalendarGrid.js`, `components/ChallengeCard.js`
- Design direction: coral/orange primary (#D85A30), clean, bold, adventurous — no emoji, SVG icons only
- Layout: hero with streak + progress bar, 30-day calendar grid, today's challenge card, fixed bottom nav
- Calendar grid: days 1–7 complete (filled coral), day 8 active (outlined), days 9–30 locked (muted)
- **Thinking:** wanted the calendar to feel like a physical advent calendar — sense of progress and anticipation for locked days

### Architecture decision — DB before challenge detail page
- Recognized that building the challenge detail UI before knowing the data shape would mean reworking it
- Decided to scaffold Supabase schema first, then build the page against real data
- **Thinking:** the shape of a "challenge" (does it have steps? tags as array or table? AI-generated flag?) determines the UI — don't build UI on assumptions

### Supabase schema (migrations 001–004)
- `challenges` — 30 pre-defined challenge definitions, seeded with real content
- `profiles` — extends `auth.users`, auto-created on signup via trigger
- `user_progress` — one row per user per day, tracks completion + optional notes
- RLS enabled on all tables from the start — anon key can read challenges, users can only touch their own rows
- **Thinking:** keep the schema loose enough to evolve — no over-normalization yet, tags as a plain text column not a join table

### Security
- SQL injection: naturally handled by Supabase client (parameterized queries). Rule: never interpolate user input into raw SQL strings
- Rate limiting: decided against in-memory Map approach — doesn't survive serverless cold starts, not shared across Vercel instances
- Went with Supabase-backed rate limiting: `last_ai_generated` on profiles + `api_call_log` table
- Uses service role key server-side to bypass RLS for writing logs — never exposed to browser
- **Thinking:** the Anthropic API costs real money, so rate limiting isn't optional — want it locked down before the AI route is wired up, not after

### Session ID (migration 004)
- Added `session_id uuid` to `api_call_log`
- **Evan's idea:** proactively asked whether session ID had value for downstream querying
- Value: per-device rate limiting, session-scoped debug traces, behavioral analytics (what did a user do in the session before completing a challenge?)
- Supabase Auth JWTs carry a `session_id` claim — extracting it server-side from the Bearer token and logging it costs nothing now, saves a schema migration later
- **Thinking:** good instinct to capture this early — join keys are cheap to store, expensive to retrofit

### Challenge detail page
- `app/challenge/[day]/page.tsx` — Server Component, fetches from Supabase by day number
- Shows title, description, duration/cost/category/difficulty tags, category-specific tips
- "Mark as Complete" button stubbed — will connect once auth is in place
- `notFound()` on invalid day numbers
- **Thinking:** keeping it as a Server Component for now — no interactivity needed until the complete button is wired to auth

### Onboarding flow (migration 005)
- `app/onboarding/page.tsx` — 3-step Client Component form
- Step 1: first name, Step 2: category preferences (multi-select chips), Step 3: time budget + difficulty
- Progress bar animates across steps, Continue disabled until valid input
- Added preference columns to `profiles`: `display_name`, `preferred_categories`, `preferred_difficulty`, `max_duration`, `onboarding_completed`
- Saves to Supabase on finish, no-ops gracefully if auth not yet present
- **Thinking:** collect preferences upfront so AI-generated challenges can be personalised from day one — don't wait until the user has been around long enough to infer taste

### Badges system (migrations 005–006)
- `badges` table — 12 seeded badge definitions with `requirement_type` + `requirement_value` + `requirement_meta` columns
- `user_badges` table — join table tracking which users have earned which badges
- Requirement types: `complete_n_days`, `complete_n_in_category`, `streak`, `difficulty` — flexible enough to evaluate server-side without schema changes
- `app/badges/page.tsx` — Server Component, fetches all badge definitions from Supabase, shows earned vs locked state
- Each badge has a unique SVG icon mapped by slug
- **Thinking:** 12 badges covers the main dimensions (streaks, categories, difficulty, completion) without being overwhelming. Kept requirement logic as data rather than hardcoded conditionals so new badges can be added by inserting a row, not deploying code

### /challenge redirect route
- `app/challenge/page.tsx` — Server Component, redirects to `/challenge/8` (today's active day)
- Single `CURRENT_DAY` constant marks where user progress lookup goes once auth lands
- **Thinking:** clean URL for the CTA button (`/challenge`) rather than hardcoding a day number in the home page link — one place to update when the logic gets real

### Profile page
- `app/profile/page.tsx` — Client Component (needs edit state)
- View mode: preferences shown as read-only coral chips (categories, difficulty, duration)
- Edit mode: same UI as onboarding — category toggles, difficulty buttons, duration grid — toggled with an Edit/Cancel button in the header
- Avatar shows name initial in coral; saves to Supabase `profiles` on confirm
**Thinking:** profile = the place users feel in control of their experience. Ke
eping edit inline (not a separate /profile/edit route) keeps it fast and reduces 
navigation depth on mobile
                                                                                      
### Onboarding expanded + .js → .tsx migration                                   
- Discovered a richer `page.js` onboarding Evan had written (4 steps: location, activities, food, availability) conflicting with the scaffolded `page.tsx`             
- Kept Evan's version — it captures neighborhood, distance, activity types, food preferences, time-of-day availability, and budget                                
- Migration 007 adds the corresponding columns to `profiles`: `neighborhood`, `max_distance`, `preferred_activities`, `preferred_foods`, `available_times`, `budget`                                                                               
- Migration 008 renames `challenges` columns to match the app's `Challenge` interface: `duration` → `estimated_duration`, `cost_estimate` → `estimated_cost`; also adds `time_of_day` and `venue_suggestion` for future AI enrichment              
- All `.js` files converted to `.tsx` across `app/`, `components/`, and `lib/` — TypeScript now enforced everywhere                                               
- **Thinking:** Evan's onboarding is more location-aware (neighborhood + distance) which sets up the AI route to generate hyper-local suggestions rather than generic ones                                                                         
                                                                               
### AI neighborhood suggestions route                                            
- Evan wired up `app/api/generate-challenge/route.ts` to call Anthropic (claude-haiku) and return 4 neighborhood suggestions based on onboarding preferences      
- Prompt takes city, activities, foods, budget → returns JSON array of `{ name, reason }` pairs                                                                   
- **Thinking:** using the onboarding data to immediately generate personalized context is the right first AI touch — it makes the preference collection feel purposeful rather than form-filling                                                   
                                                                               
### Security hardening — API route (Evan's initiative)                           
Evan identified three gaps and flagged them for fixing:                                                                                                          
1. **No auth check** — anyone could call the route unauthenticated and rack up Anthropic spend                                                                    
- Fixed: Bearer token extracted from `Authorization` header, validated via `supabase.auth.getUser()`                                                           
- Returns 401 if missing or invalid                                           
                                                                               
2. **No input sanitization** — city/activities/foods went raw into the prompt, vulnerable to prompt injection (`"New York. Ignore previous instructions and..."`) 
- Fixed: `sanitize()` strips everything except word chars, spaces, commas, ampersands, hyphens; caps at 100 chars                                              
- Applied to all three user-supplied fields before they touch the prompt      
 **No rate limiting** — a single user could hammer the endpoint                
- Fixed: wired in the existing `checkAiGenerationLimit` / `recordAiGeneration`/`tooManyRequestsResponse` utilities from `lib/rateLimit.tsx`                  
Session ID extracted from JWT and logged alongside the call                 
**Thinking:** Evan proactively audited the route before it went to prod — good instinct. The sanitizer regex is intentionally strict (allowlist not denylist) because prompt injection vectors are hard to predict. Rate limiting was already built; it just needed connecting.

---

## April 19 2026

### Native binary fix — lightningcss
- Dev server was throwing `Cannot find module '../lightningcss.darwin-arm64.node'` at startup, blocking all CSS compilation
- Root cause: the `.node` binary was missing from `node_modules/lightningcss/node/` — likely a partial install or cross-platform npm cache hit
- Fix: `npm rebuild lightningcss` + `npm install lightningcss` to force a clean platform-specific binary; also cleared the stale `.next` cache (Turbopack had bundled the broken reference)
- **Thinking:** native binaries don't survive copy/paste installs across machines or CI caches — when you see a `.node` resolution error, check the package's optional dependencies before reaching for `rm -rf node_modules`

### Profile page UX — redirect after save
- After saving preferences the button showed "Saved!" but left the user on the profile page with no path forward
- Fix: replaced the 3-second `setTimeout(() => setSaved(false))` with `setTimeout(() => router.push('/'), 800)` — brief confirmation flash, then navigate home
- Also removed an errant top-level `useRouter()` call that had been inserted outside the component body (React Rules of Hooks violation)
- **Thinking:** "Saved!" with no action is a dead end on mobile — saving preferences implies you're done configuring and ready to use the app. The redirect completes the flow rather than leaving the user to figure out what's next

### Real month calendar — native Date, no library
- The original `CalendarGrid` was a 1–30 numbered streak tracker with no connection to real dates
- Replaced with a true wall-calendar month view using only `new Date()`:
  - Current month + year header with prev/next navigation
  - Day-of-week labels (Sun–Sat)
  - Proper first-day offset using `new Date(year, month, 1).getDay()`
  - Today highlighted with coral ring, completed days filled coral with checkmark, future days muted
  - "Today is [Weekday], [Month] [Date]" label shown when on the current month
- Completed days are mapped backwards from today by the `completedDays` prop — no schema change needed
- **Thinking:** a streak tracker that shows "Day 7 of 30" is motivating, but it doesn't tell you *when* you did things. A real calendar anchors the habit to your actual life — you can see you completed a challenge last Tuesday, not just that you're on day 7. Also: no calendar library needed for a month view; the built-in Date API handles all the math in ~15 lines

### Single source of truth for daily challenge
- The home page `ChallengeCard` had hardcoded defaults ("Morning Market Run", links to `/challenge/8`) while the detail page fetched real data from Supabase — they could never agree
- `app/challenge/page.tsx` also had `CURRENT_DAY = 8` hardcoded
- Fix: created `lib/getDailyChallenge.ts` with two exports:
  - `getDayNumberForDate(date)` — pure function, converts a date to a stable 1–30 day number via `((dayOfYear - 1) % 30) + 1`. Same date always returns the same number. No state, no DB, testable in isolation
  - `getDailyChallenge(date)` — wraps the above with `getChallengeByDay()` from the Supabase helper
- Updated `app/page.tsx` to be async, call `getDailyChallenge()` server-side, pass real fields to `ChallengeCard`
- Updated `ChallengeCard` to require explicit props (removed all defaults) — a missing prop is now a compile error, not a silent stale value
- Updated `app/challenge/page.tsx` to redirect to `getDayNumberForDate()` instead of the hardcoded 8
- **Thinking:** two components reading from different sources will diverge the moment the data changes — the fix isn't to sync them, it's to give them one source. The deterministic date hash means no DB call just to know which day it is, and the behavior is predictable: you can reason about what any date will return without running the app. Removing the hardcoded defaults from `ChallengeCard` turns a runtime inconsistency into a compile-time contract
