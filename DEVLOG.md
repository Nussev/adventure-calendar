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

### AI-generated daily challenges — `app/api/daily-challenge/route.ts`
- New GET endpoint that calls the Anthropic API (`claude-haiku-4-5`) to generate today's challenge
- Accepts a `?date=YYYY-MM-DD` param — validated to only accept today's date (arbitrary date probing would bypass caching and generate unlimited API calls at cost)
- IP rate limit: 5 Anthropic calls per IP per hour using an in-memory counter — protects against abuse on cache misses
- Response shape: `{ title, description, difficulty, category, estimatedTime }`
- Accepts user preference query params (`city`, `neighborhood`, `distance`, `activities`, `foods`, `times`, `budget`, `duration`) and weaves them into the prompt when present — gracefully falls back to a generic prompt if no prefs are set
- Returns a hardcoded FALLBACK challenge on any Anthropic error rather than a 500 — the user always gets something usable
- **Thinking:** the date guard is the most important cost control here — once the client caches today's challenge in localStorage, the server should only ever be called once per user per day. The IP rate limit catches the gap before that cache is warm. A Supabase-backed rate limit (like the generate-challenge route uses) would be more robust across serverless instances, but for a route that's only hit once a day per user, an in-memory counter is simpler and sufficient. Set a spending cap in the Anthropic console as the final backstop

### Client-side getDailyChallenge utility — localStorage cache + preference passthrough
- Rewrote `lib/getDailyChallenge.ts` as a client-side utility (uses localStorage — cannot be called server-side)
- `getDailyChallenge()` checks `localStorage['todaysChallenge']` first; if the stored date matches today it returns immediately without a network call
- On cache miss: reads `localStorage['adventurePreferences']`, builds query params from whatever fields are set, fetches `/api/daily-challenge`
- Returns `DailyChallenge | null` (null = API failed, no cache) — callers own the fallback UI rather than silently receiving stale content
- `clearChallengeCache()` exported so the profile save and randomize button can invalidate the cache when needed
- `getDayNumberForDate()` kept as a pure export — still safe to import from server components since it never touches localStorage
- **Thinking:** localStorage caching means the Anthropic call happens at most once per day per browser regardless of how many times the user navigates between the home page and detail page. Returning null on failure (rather than a silent fallback value) makes the error state explicit — the component decides whether to show a message, a retry button, or a placeholder, not the utility

### Profile preferences → localStorage sync
- `handleSave` in `app/profile/page.tsx` now writes to `localStorage['adventurePreferences']` alongside the Supabase upsert
- Calls `clearChallengeCache()` after saving so the next home-page visit regenerates with the new preferences rather than serving yesterday's cached challenge
- `loadProfile` also writes to localStorage after loading from Supabase — so preferences are available to `getDailyChallenge()` immediately on a new device session, not only after the user explicitly hits Save
- **Thinking:** Supabase is the source of truth for preferences; localStorage is a read cache for the challenge utility. Writing to localStorage on both load and save means the utility can always read preferences without a Supabase round-trip. The cache bust on save is the critical piece — without it the user would save new preferences and still see the old challenge until midnight

### DailyChallengeSection client component
- Replaced the previous `DailyChallengeSection` with one that handles three states: loading skeleton, error ("Could not load challenge. Try again later."), and the rendered `ChallengeCard`
- Loading state uses an `animate-pulse` skeleton that matches the card's layout — no layout shift when the challenge loads
- Added "↺ Randomize Challenge" button: clears localStorage cache, re-fetches from the API, updates the displayed challenge in place — disabled with "Getting new challenge…" label while the request is in flight
- **Thinking:** the randomize button is the main reason the cache has to live client-side rather than only server-side. A server-side in-memory cache would return the same challenge to every user regardless of their preferences, and there'd be no way for the client to bust it per-user. With localStorage, each user's cache is independent and the randomize button can clear it without affecting anyone else

### Challenge detail page — client component, shared source
- Converted `app/challenge/[day]/page.tsx` from a Server Component (Supabase + `getChallengeByDay`) to a `'use client'` component
- Calls `getDailyChallenge()` in a `useEffect` — when the user navigates here from the home page the localStorage cache is already warm so it returns instantly with no extra API call
- Removed `estimated_cost` meta tag (not in the AI challenge shape); shows `estimatedTime` + `difficulty` badge + `category` instead
- Loading state uses a skeleton that mirrors the page layout
- Error state shows "Could not load challenge. Try again later." with a back link
- The `[day]` URL param is kept for display ("Day X of 30") but no longer drives which challenge is fetched — both pages always show today's challenge from the same source
- **Thinking:** the detail page previously fetched from Supabase independently, which meant it could show a different challenge than the home page if the DB row and the AI-generated challenge diverged. Making both pages call the same `getDailyChallenge()` function removes that class of inconsistency entirely — the localStorage cache guarantees they render the same data in the same browser session

### UI/UX refresh — modern, subtle, premium feel
- Inspiration pulled from Stripe (ambient gradient glows, gradient text + buttons, bold type hierarchy), Apple Store (generous whitespace, rounded-3xl cards, clean nav), and Google Drive (clean minimal layout, soft shadows)
- **globals.css**: replaced flat `#F9FAFB` background with warm `#FAF9F7`; added CSS custom properties (`--card`, `--accent`, `--accent-light`) so all components share one token source; added smooth scrolling, antialiasing, subtle custom scrollbar, and accessible focus rings
- **app/page.tsx**: added ambient radial gradient blobs (fixed, pointer-events-none) for the Stripe-style background glow; gradient text on "Calendar" headline via `-webkit-background-clip`; gradient fill on the progress bar; glassmorphism bottom nav using `backdrop-filter: blur(20px)` + semi-transparent background; updated page title and description metadata
- **ChallengeCard.tsx**: upgraded top accent from flat coral bar to a 3-color gradient stripe (coral → orange → amber); replaced flat CTA button with gradient + drop shadow; rounded corners upgraded to `rounded-3xl`; tag pills now use CSS variable colors so they adapt to dark mode
- **CalendarGrid.tsx**: completed-day cells now use the same gradient as the accent bar instead of flat coral; today cell gets a glowing ring via `box-shadow`; all colors moved to CSS variables for dark-mode compatibility; day label opacity reduced for cleaner visual hierarchy
- **DailyChallengeSection.tsx**: skeleton loader updated to match new rounded-3xl card shape and gradient accent; randomize button hover state wired via inline event handlers (Tailwind can't express dynamic CSS variable transitions); error state card matches new card surface styles
- **Design philosophy:** every change was additive — no layout structure changed, no features removed. The goal was to elevate the existing design to the level of polish users expect from consumer apps: subtle depth, intentional color, and smooth transitions. The app already had the right bones (coral accent, SVG icons, clean hierarchy) — this pass adds the skin
- **Thinking:** Stripe and Apple both use ambient gradients not as focal points but as atmosphere — they make the page feel alive without competing with the content. The key is keeping opacity low (7–12%) and blurring heavily so they read as light, not color. The glassmorphism nav is the same principle: it signals "there's content behind this" without being distracting

### Nav layout fix — proper footer, all pages clickable
- **Root cause:** home page `<main>` had `z-10` but the nav had no z-index — stacking context caused main content to sit above the nav, blocking clicks on Badges and Profile tabs
- **Fix:** replaced `fixed bottom-0` nav with a true flex-column layout (`h-screen flex flex-col overflow-hidden`) on all three pages: outer container fills the screen, `<main>` gets `flex-1 overflow-y-auto` so only it scrolls, nav sits as a natural bottom element with `shrink-0`
- **BottomNav component:** extracted into `components/BottomNav.tsx` — a single shared component with an `active` prop; all pages import it so the nav is defined in one place
- **Profile save button:** moved out of `fixed bottom-0` into the flex layout between the scroll area and the nav — it behaves as a persistent bar without fighting z-index
- **Thinking:** `fixed` positioning for navs is fragile — it relies on everything else having the right z-index and the scroll container stopping at the right point. A flex column layout is more robust: the browser handles the geometry, nothing can overlap, and it works correctly on every screen size without extra padding hacks

### generate-challenge — venue-specific AI + DB-fetched preferences
- **Problem:** the route was trusting the client to pass user preferences in the request body — a security smell (client could send fake/missing data) and a staleness risk (localStorage might lag behind what's saved in Supabase)
- **Fix:** route now fetches the user's full profile from Supabase using the service-role client, using only the authenticated `user.id` from the JWT — client sends only `{ dayNumber }`, server owns all preference data
- **Migration 010:** added `preferred_venue_types text[]` to `profiles` and `venue_type text` to `challenges` — lets users express what kinds of places they want (restaurants, bars, museums, parks, etc.) and lets us store + filter by that later
- **Prompt upgrade:** new prompt tells Claude it is "a hyper-local adventure guide with deep knowledge of {city}" and instructs it to name a REAL, specific venue — not a generic description. Added explicit rule: if Claude isn't certain of an exact address, give the neighbourhood rather than fabricate one. Added `venue_type` to the returned JSON so we know what kind of place was suggested
- **Profile page:** added "Venue types" multi-select section with 12 options (Restaurants, Bars, Coffee shops, Museums, Art galleries, Parks, Live music venues, Markets, Fitness studios, Theatres, Bookshops, Hidden gems). Saves to `preferred_venue_types` in Supabase and localStorage. Reads back from both on load
- **Thinking:** moving preference ownership to the server is the right call — the client is a display layer, not a data layer. The venue-type preference is the key unlock for making challenges feel personal: "suggest a place near me" is generic, "suggest a jazz bar in Williamsburg" is something you'd actually go to

---

## April 21 2026

### Schema reconciliation — migration 012
- Added `profiles.updated_at` with auto-update trigger
- Added `profiles.availability text` (single-value `'weekdays'|'weekends'|'both'`) alongside the existing `available_times text[]` (multi-select)
- Added `challenges.challenge_date date` with partial unique index `(user_id, challenge_date)` — supports real-calendar-date keyed challenges vs. the existing 1–30 `day_number` scheme
- Added `challenges.is_completed boolean` and `challenges.completed_at timestamptz` directly on the row — completion no longer requires joining `user_progress` for basic reads
- Added `challenges.estimated_time text` alongside `estimated_duration` (both names appear in different parts of the codebase)
- Added `user_badges.badge_type text` with backfill from `badges.slug` — lets callers filter without a join
- **Thinking:** additive migration only — no renames, no drops. Existing `onConflict: 'user_id,day_number'` calls still work; the new date index is a separate partial index

### localStorage → Supabase for challenges + preferences
- **Problem:** challenge caching and preference reads were split across localStorage (client) and Supabase (server) — stale prefs, cross-device data loss, and two diverging sources of truth
- **`lib/getDailyChallenge.ts`:** rewrote as a thin client that POSTs to `/api/generate-challenge` with `{ challengeDate, force }`. No more localStorage reads or writes. `clearChallengeCache()` is kept as a no-op export so call-sites compile without changes
- **`/api/generate-challenge`:** now accepts `{ challengeDate: string, force?: boolean }` in addition to legacy `{ dayNumber }`. Before calling Anthropic, checks the `challenges` table for `(user_id, challenge_date)` — if a row exists and `force` is false, returns it immediately (zero Anthropic cost). Rate limiting is now only charged when Anthropic is actually called. Saves `challenge_date` alongside `day_number`. Uses insert-or-update instead of upsert to avoid partial-index conflicts
- **`/api/complete-challenge`:** also updates `challenges.is_completed = true` and `challenges.completed_at` on the row directly, in addition to the existing `user_progress` upsert. Extracted shared `completedAt` timestamp so both tables are always in sync
- **`app/profile/page.tsx`:** removed both `localStorage.setItem('adventurePreferences', ...)` calls (load-sync and save-sync). Supabase is the only store; the generate-challenge route fetches preferences server-side on every generation
- **`components/DailyChallengeSection.tsx`:** randomize button now calls `getDailyChallenge(true)` directly instead of `clearChallengeCache()` + `getDailyChallenge()`. `force=true` is forwarded through to the API so the server regenerates even when a DB row exists
- **Thinking:** the key insight is that the "cache" should live in the DB, not localStorage. localStorage is invisible to other devices and disappears on browser clear. A `challenges` row keyed to `(user_id, challenge_date)` gives the same "generate once per day" guarantee but persists across devices and sessions. The `force` flag threads through all layers — client → getDailyChallenge → API → DB — so randomize still works without a separate cache-clear mechanism

---

## April 25 2026

### The repetition problem — and the retention mechanic that fixes it

**The problem:** Every daily challenge was generated in isolation. Claude got user preferences but no memory of what it had already suggested. A user who completed "craft beer bar crawl" on day 3 could easily see another bar crawl on day 7. By day 10, patterns become obvious. By day 15, users start skipping challenges because nothing feels new. This is a churn problem disguised as a prompt quality problem — the real issue is that freshness decays exponentially without history.

**What we considered:** Three approaches:
1. Hard-code category rotation (day 1 = food, day 2 = outdoors, etc.) — too rigid, ignores preferences and actual user behavior
2. Tag challenges with a deduplication hash and reject repeats — complex, requires multiple API calls, still doesn't communicate *why* to Claude
3. Feed completed challenge history directly into the prompt — Claude understands the constraint semantically and reasons about novelty, not just exact-match deduplication

Option 3 wins because it solves the problem at the right layer. Claude already reasons well about "what would feel different" — it just needed the context to do so.

**Implementation:** Two changes, one mechanic.

In `app/api/generate-challenge/route.ts` (step 5b), before building the prompt, we now query the `challenges` table for the last 10 completed challenges and extract `title`, `category`, and `venue_stop` types. These get injected into the prompt as a "do NOT repeat" block:

```
COMPLETED CHALLENGES — do NOT repeat these categories, venue types, or activity styles:
- Craft Beer Crawl (Food & drink, stops at: Bar, Bar, Music venue)
- Golden Gate Sunrise Hike (Outdoors, stops at: Park, Coffee shop)
...

Generate something meaningfully different in category, venue type, and vibe from everything above.
```

This works because Claude treats it as a constraint, not a filter. It doesn't just avoid the exact titles — it reasons about what "meaningfully different" means in context and picks something that contrasts along multiple dimensions (category, venue type, time of day, energy level).

In `app/challenge/[day]/page.tsx`, the "Mark as Complete" button was previously a static UI element that called nothing. It now POSTs to `/api/complete-challenge` with `challenge.id` and `dayNumber`, handles loading state ("Saving…") and flips to a green "✓ Completed!" on success. The API was already complete — streak tracking, badge logic, and the `is_completed` flag on the `challenges` row were all there. The button just wasn't wired.

**The flywheel:** Completing a challenge writes `is_completed = true` to the DB row. The next generation query picks that up. Claude's next challenge avoids those categories. The new challenge feels fresh and specific. The user wants to complete it. That completion feeds the next generation. The loop tightens over time rather than decaying.

**Why this matters for the product:** Without history, day 15 is worse than day 1 — the model is generating from the same distribution forever. With history, day 15 is *better* than day 1 — the constraint space narrows, Claude has to work harder to find something novel, and the result is a challenge that genuinely feels tailored to someone who has already done 14 things. That's the opposite of the typical app experience where engagement drops after the first week.

- **Thinking:** the right time to build this was the moment the "Mark as Complete" button existed — both pieces were always needed together. A completion that doesn't feed the next generation is a dead write. A generation that ignores completions produces repetition. They're one feature, not two.

### Security audit — all criticals resolved

Ran a full audit across API routes, Supabase RLS, environment variables, rate limiting, Anthropic key exposure, and prompt injection vectors. Seven issues found and fixed.

**Critical (broken in production):**

- **Silent RLS rejection on challenge completion** (`complete-challenge/route.ts`): The route used the anon Supabase client to `UPDATE challenges SET is_completed=true`. No UPDATE policy existed on the `challenges` table, so RLS silently rejected every write. `is_completed` was never set. This meant the calendar showed zero completions and the history injection mechanic (which queries `is_completed=true`) never fired. Fixed by switching to the service role client for this write — same pattern used by `generate-challenge`. Also added an explicit UPDATE policy in migration 013 as a fallback.

- **`challenges: public read` RLS policy exposed all users' data** (`001_create_tables.sql`, migration 013): The original policy used `using (true)`, which was correct when challenges were pre-seeded public content. After user-specific AI-generated challenges were added to the same table, this policy let any request — including unauthenticated — read every user's challenges. User challenges contain inferred location data and personal preferences. Fixed: `using (user_id is null OR auth.uid() = user_id)` — pre-seeded rows stay public, user rows are scoped to their owner.

**High (Anthropic cost exposure):**

- **`/api/daily-challenge` — no authentication**: This legacy route called Anthropic with only an in-memory IP counter as protection. The in-memory counter resets on every serverless cold start, providing almost no real protection. The route was also dead — `getDailyChallenge.ts` had already been rewritten to call `/api/generate-challenge` instead. Deleted the file entirely.

- **`force=true` bypassed rate limiting entirely**: Any authenticated user could POST `{ force: true }` and generate unlimited challenges, bypassing the 24h limit. Added `checkCallLogLimit` — a count-based rate limit on `api_call_log` — capping force re-rolls at 5 per day per user. Force re-rolls record under `'generate-challenge-force'` so they don't consume the regular 1/day budget.

- **`/api/neighborhood-suggestions` — no rate limiting**: Authenticated users could spam this endpoint freely. Each call hits Anthropic. Wired up `checkCallLogLimit` (5 per hour) and `recordAiGeneration` around the Anthropic call.

**Medium:**

- **Stored prompt injection via challenge history**: Previous Claude output (challenge titles, categories, venue types) was being fed back into the next generation prompt without sanitization. If a response ever contained injection content that got stored in the DB, it would execute on every future generation for that user. Fixed by running all history fields through the existing `sanitize()` function before prompt injection.

**Low:**

- **Wrong table name in onboarding** (`onboarding/page.tsx`): `supabase.from('users')` was writing to a table that doesn't exist. Should be `profiles`. Column names were also wrong (`activities` → `preferred_activities`, `distance` → `max_distance`, etc.). Onboarding data had been silently discarded since the feature was built. Fixed.

**Clean:**

- `ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_PLACES_API_KEY` all correctly server-side only, no `NEXT_PUBLIC_` prefix
- Anthropic client never instantiated in client components
- `sanitize()` already applied to all user-supplied preference fields before prompt injection

- **Thinking:** the most valuable find was the silent RLS rejection — it broke the two most recent features (calendar completion display, history injection) without any visible error. Silent failures are the hardest class of bug to catch: everything appears to work, the button completes, the API returns 200, but the write never happened. The audit pattern (read every route, trace every DB write, check every table for missing policies) is the only way to catch them.
