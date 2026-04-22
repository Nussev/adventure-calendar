import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Browser client — uses @supabase/ssr so the session is stored in cookies
// instead of localStorage. This means server-side route handlers can read
// the session automatically via createSupabaseServerClient().
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// ── Types ────────────────────────────────────────────────────

export interface Challenge {
  id: string
  day_number: number
  title: string
  description: string
  category: string
  difficulty: string
  estimated_cost: string
  estimated_duration: string
  time_of_day: string | null
  venue_suggestion: string | null
  venue_address: string | null
  venue_price: string | null
  route_tip: string | null
  ai_generated: boolean
  user_id: string | null
  generated_at: string | null
  created_at: string
}

export interface UserProgress {
  id: string
  user_id: string
  challenge_id: string
  day_number: number
  completed_at: string | null
  skipped: boolean
  notes: string | null
  challenge?: Challenge
}

// ── Query helpers ────────────────────────────────────────────

/** Fetch a single challenge by its day number (1–30). */
export async function getChallengeByDay(dayNumber: number): Promise<Challenge> {
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('day_number', dayNumber)
    .single()

  if (error) throw new Error(`getChallengeByDay(${dayNumber}): ${error.message}`)
  return data
}

/** Fetch all 30 challenges ordered by day. */
export async function getAllChallenges(): Promise<Challenge[]> {
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .order('day_number')

  if (error) throw new Error(`getAllChallenges: ${error.message}`)
  return data
}

/** Fetch all progress rows for a user, joined with challenge data. */
export async function getUserProgress(userId: string): Promise<UserProgress[]> {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*, challenge:challenges(*)')
    .eq('user_id', userId)
    .order('day_number')

  if (error) throw new Error(`getUserProgress(${userId}): ${error.message}`)
  return data
}

/** Mark a challenge as completed for the current user. */
export async function completeChallenge(
  userId: string,
  challengeId: string,
  dayNumber: number,
  notes: string | null = null
): Promise<UserProgress> {
  const { data, error } = await supabase
    .from('user_progress')
    .upsert(
      {
        user_id: userId,
        challenge_id: challengeId,
        day_number: dayNumber,
        completed_at: new Date().toISOString(),
        skipped: false,
        notes,
      },
      { onConflict: 'user_id,day_number' }
    )
    .select()
    .single()

  if (error) throw new Error(`completeChallenge: ${error.message}`)
  return data
}