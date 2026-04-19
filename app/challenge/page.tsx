import { redirect } from 'next/navigation'
import { getDayNumberForDate } from '@/lib/getDailyChallenge'

export default function ChallengePage() {
  redirect(`/challenge/${getDayNumberForDate()}`)
}
