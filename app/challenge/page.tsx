// /challenge — redirects to the current active day.
// Once auth is built this will look up the user's progress
// and redirect to their actual current day number.

import { redirect } from 'next/navigation'

const CURRENT_DAY = 8 // TODO: derive from user_progress once auth is wired

export default function ChallengePage() {
  redirect(`/challenge/${CURRENT_DAY}`)
}
