// Client-side only — uses localStorage. Safe to import from server components
// as long as none of these functions are *called* server-side.

export interface AdventurePreferences {
  city?: string
  neighborhood?: string
  distance?: string
  activities?: string[]
  foods?: string[]
  times?: string[]
  budget?: string
  duration?: string
}

export interface DailyChallenge {
  title: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  category: string
  estimatedTime: string
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

function getPreferences(): AdventurePreferences {
  try {
    const raw = localStorage.getItem('adventurePreferences')
    return raw ? (JSON.parse(raw) as AdventurePreferences) : {}
  } catch {
    return {}
  }
}

function getCachedChallenge(): DailyChallenge | null {
  try {
    const raw = localStorage.getItem('todaysChallenge')
    if (!raw) return null
    const { date, challenge } = JSON.parse(raw) as { date: string; challenge: DailyChallenge }
    return date === todayStr() ? challenge : null
  } catch {
    return null
  }
}

export function clearChallengeCache(): void {
  try {
    localStorage.removeItem('todaysChallenge')
  } catch {}
}

// Returns null when the API fails and there is no cache — lets callers show
// a proper error UI rather than silently showing stale/fallback content.
export async function getDailyChallenge(): Promise<DailyChallenge | null> {
  const cached = getCachedChallenge()
  if (cached) return cached

  const prefs = getPreferences()
  const params = new URLSearchParams({ date: todayStr() })

  if (prefs.city) params.set('city', prefs.city)
  if (prefs.neighborhood) params.set('neighborhood', prefs.neighborhood)
  if (prefs.distance) params.set('distance', prefs.distance)
  if (prefs.budget) params.set('budget', prefs.budget)
  if (prefs.duration) params.set('duration', prefs.duration)
  if (prefs.activities?.length) params.set('activities', prefs.activities.join(','))
  if (prefs.foods?.length) params.set('foods', prefs.foods.join(','))
  if (prefs.times?.length) params.set('times', prefs.times.join(','))

  try {
    const res = await fetch(`/api/daily-challenge?${params}`)
    if (!res.ok) return null
    const challenge = await res.json() as DailyChallenge
    try {
      localStorage.setItem('todaysChallenge', JSON.stringify({ date: todayStr(), challenge }))
    } catch {}
    return challenge
  } catch {
    return null
  }
}
