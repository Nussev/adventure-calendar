// Fetches today's challenge from Supabase via /api/generate-challenge.
// The server checks the DB first — Anthropic is only called on a cache miss.
// Pass force=true to bypass the DB cache and regenerate.

export interface VenueStop {
  order:         number
  venue_name:    string
  venue_address: string
  venue_type:    string
  what_to_do:    string[]   // array of short action fragments
  google_rating: number | null
  review_count:  number | null
  price_level:   string | null
  tip:           string
}

export interface DailyChallenge {
  id?:                string
  title:              string
  description:        string
  difficulty:         'easy' | 'medium' | 'hard'
  category:           string
  estimatedTime:      string
  estimated_duration?: string
  estimated_cost?:    string
  time_of_day?:       string
  venue_stops?:       VenueStop[]
  is_completed?:      boolean
}

export function getDayNumberForDate(date: Date = new Date()): number {
  const year = date.getFullYear()
  const start = new Date(year, 0, 1)
  const dayOfYear = Math.floor((date.getTime() - start.getTime()) / 86_400_000) + 1
  return ((dayOfYear - 1) % 30) + 1
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

// Kept for call-site compatibility — cache now lives in Supabase, not localStorage.
export function clearChallengeCache(): void {}

export async function getDailyChallenge(force = false): Promise<DailyChallenge | null> {
  try {
    const res = await fetch('/api/generate-challenge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeDate: todayStr(), force }),
    })
    if (!res.ok) return null

    const body = await res.json() as { challenge?: Record<string, unknown> }
    const c = body.challenge
    if (!c) return null

    const estimatedTime = (c.estimated_duration ?? c.estimated_time ?? '') as string

    return {
      id:                 c.id as string,
      title:              c.title as string,
      description:        c.description as string,
      difficulty:         c.difficulty as 'easy' | 'medium' | 'hard',
      category:           c.category as string,
      estimatedTime,
      estimated_duration: c.estimated_duration as string | undefined,
      estimated_cost:     c.estimated_cost as string | undefined,
      time_of_day:        c.time_of_day as string | undefined,
      venue_stops:        ((c.venue_stops as VenueStop[] | undefined) ?? []).map(s => ({
        ...s,
        // Legacy rows stored what_to_do as a string — split into fragments for display
        what_to_do: Array.isArray(s.what_to_do)
          ? s.what_to_do
          : (s.what_to_do as unknown as string).split(/\.\s+/).filter(Boolean),
      })),
      is_completed:       c.is_completed as boolean | undefined,
    }
  } catch {
    return null
  }
}
