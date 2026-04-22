'use client'

import { useState, useEffect } from 'react'
import ChallengeCard from './ChallengeCard'
import {
  getDailyChallenge,
  getDayNumberForDate,
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
    const fresh = await getDailyChallenge(true)
    if (fresh) { setChallenge(fresh); setError(false) }
    else setError(true)
    setRandomizing(false)
  }

  if (loading) return <Skeleton />

  if (error || !challenge) {
    return (
      <div
        className="rounded-3xl p-6 text-center space-y-3"
        style={{
          background: "var(--card)",
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <p className="text-sm" style={{ color: "var(--foreground)", opacity: 0.5 }}>
          Could not load challenge. Try again later.
        </p>
        <button
          onClick={handleRandomize}
          disabled={randomizing}
          className="text-sm font-semibold text-[#D85A30] hover:underline disabled:opacity-40 transition-opacity"
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
        className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-40"
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          color: "var(--foreground)",
          opacity: randomizing ? 0.5 : undefined,
        }}
        onMouseEnter={e => {
          if (!randomizing) {
            e.currentTarget.style.borderColor = '#D85A30'
            e.currentTarget.style.color = '#D85A30'
          }
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)'
          e.currentTarget.style.color = 'var(--foreground)'
        }}
      >
        {randomizing ? 'Getting new challenge…' : '↺ Randomize Challenge'}
      </button>
    </div>
  )
}

function Skeleton() {
  return (
    <div
      className="rounded-3xl overflow-hidden animate-pulse"
      style={{
        background: "var(--card)",
        border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      <div
        className="h-[3px] w-full"
        style={{ background: "linear-gradient(90deg, #D85A30, #f97316, #fbbf24)", opacity: 0.3 }}
      />
      <div className="p-5 space-y-3">
        <div className="h-2.5 rounded-full w-1/3" style={{ background: "var(--muted)" }} />
        <div className="h-6 rounded-lg w-2/3" style={{ background: "var(--muted)" }} />
        <div className="h-4 rounded-full w-full" style={{ background: "var(--locked-bg)" }} />
        <div className="h-4 rounded-full w-4/5" style={{ background: "var(--locked-bg)" }} />
        <div className="flex gap-2 pt-1">
          <div className="h-7 rounded-full w-20" style={{ background: "rgba(216,90,48,0.08)" }} />
          <div className="h-7 rounded-full w-20" style={{ background: "rgba(216,90,48,0.08)" }} />
        </div>
        <div className="h-11 rounded-xl mt-1" style={{ background: "var(--muted)" }} />
      </div>
    </div>
  )
}
