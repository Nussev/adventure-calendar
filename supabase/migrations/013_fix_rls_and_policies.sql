-- ============================================================
-- Adventure Calendar — fix RLS policies on challenges table
--
-- Problem 1: "challenges: public read" uses `using (true)` which
--   lets any request (including unauthenticated) read every user's
--   AI-generated challenges. User challenges contain location data
--   and personal preferences — they should only be readable by
--   their owner. Pre-seeded challenges (user_id IS NULL) stay public.
--
-- Problem 2: No UPDATE policy existed, so the complete-challenge
--   route's attempt to set is_completed=true was silently rejected
--   by RLS, breaking completion tracking and history injection.
-- ============================================================

-- ── 1. Replace the permissive read policy ───────────────────
drop policy if exists "challenges: public read"  on challenges;
drop policy if exists "challenges: scoped read"  on challenges;

create policy "challenges: scoped read"
  on challenges for select
  using (
    user_id is null          -- pre-seeded public challenges
    or auth.uid() = user_id  -- user's own AI-generated challenges
  );

-- ── 2. Add update policy so is_completed can be set ─────────
-- (also used as a fallback if the service role client is
--  ever swapped for the anon client in future refactors)
drop policy if exists "challenges: own update" on challenges;

create policy "challenges: own update"
  on challenges for update
  using (auth.uid() = user_id);

-- ── 3. Add insert policy for user-generated challenges ───────
-- The generate-challenge route uses the service role key which
-- bypasses RLS, but this policy closes the gap if that ever
-- changes and ensures the intent is explicit.
drop policy if exists "challenges: own insert" on challenges;

create policy "challenges: own insert"
  on challenges for insert
  with check (auth.uid() = user_id);
