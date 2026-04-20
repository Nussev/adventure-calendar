'use client'

import { useState, useEffect } from 'react'
import ChallengeCard from './ChallengeCard'
import {
  getDailyChallenge,
  getDayNumberForDate,
  clearChallengeCache,
  type DailyChallenge,
} from '@/lib/getDailyChallenge'

export default function DailyChallengeSection() {
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [randomizing, setRandomizing] = useState(false)
  const todayDayNumber = getDayNumberForDate()

  useEffect(() => {
    getDailyChallenge().then(c => {
      if (c) { setChallenge(c); setError(false) }
      else setError(true)
      setLoading(false)
    })
  }, [])

  async function handleRandomize() {
    setRandomizing(true)
    setError(false)
    clearChallengeCache()
    const fresh = await getDailyChallenge()
    if (fresh) { setChallenge(fresh); setError(false) }
    else setError(true)
    setRandomizing(false)
  }

  if (loading) return <Skeleton />

  if (error || !challenge) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center space-y-3">
        <p className="text-sm text-gray-500">Could not load challenge. Try again later.</p>
        <button
          onClick={handleRandomize}
          disabled={randomizing}
          className="text-sm font-semibold text-[#D85A30] hover:underline disabled:opacity-50"
        >
          {randomizing ? 'Trying…' : 'Try again'}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <ChallengeCard
        title={challenge.title}
        description={challenge.description}
        time={challenge.estimatedTime}
        category={challenge.category}
        href={`/challenge/${todayDayNumber}`}
      />
      <button
        onClick={handleRandomize}
        disabled={randomizing}
        className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:border-[#D85A30] hover:text-[#D85A30] active:bg-orange-50 transition-colors disabled:opacity-50"
      >
        {randomizing ? 'Getting new challenge…' : '↺ Randomize Challenge'}
      </button>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden animate-pulse">
      <div className="h-1.5 bg-gray-200" />
      <div className="p-5 space-y-3">
        <div className="h-3 bg-gray-100 rounded w-1/3" />
        <div className="h-6 bg-gray-200 rounded w-2/3" />
        <div className="h-4 bg-gray-100 rounded w-full" />
        <div className="h-4 bg-gray-100 rounded w-4/5" />
        <div className="flex gap-2 pt-1">
          <div className="h-7 bg-orange-50 rounded-full w-20" />
          <div className="h-7 bg-orange-50 rounded-full w-20" />
        </div>
        <div className="h-11 bg-gray-200 rounded-xl mt-1" />
      </div>
    </div>
  )
}
