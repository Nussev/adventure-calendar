import { getChallengeByDay, type Challenge } from './supabase'

/**
 * Returns a day number 1–30 that is stable for a given calendar date.
 * Passing a date always returns the same value, so both the home card
 * and the detail page will always agree on "today's" challenge.
 */
export function getDayNumberForDate(date: Date = new Date()): number {
  const year = date.getFullYear()
  const start = new Date(year, 0, 1)
  const dayOfYear = Math.floor((date.getTime() - start.getTime()) / 86_400_000) + 1
  return ((dayOfYear - 1) % 30) + 1
}

export async function getDailyChallenge(date: Date = new Date()): Promise<Challenge> {
  return getChallengeByDay(getDayNumberForDate(date))
}
