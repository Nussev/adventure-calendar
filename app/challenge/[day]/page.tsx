'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getDailyChallenge, type DailyChallenge } from '@/lib/getDailyChallenge'

const difficultyConfig = {
  easy:   { label: 'Easy',   color: 'text-green-600', bg: 'bg-green-50',  border: 'border-green-200' },
  medium: { label: 'Medium', color: 'text-amber-600', bg: 'bg-amber-50',  border: 'border-amber-200' },
  hard:   { label: 'Hard',   color: 'text-red-600',   bg: 'bg-red-50',    border: 'border-red-200'   },
} as const

export default function ChallengePage() {
  const { day } = useParams<{ day: string }>()
  const dayNumber = parseInt(day, 10)

  const [challenge, setChallenge] = useState<DailyChallenge | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    // getDailyChallenge() returns from localStorage cache instantly when the
    // user navigated here from the home page — no extra API call.
    getDailyChallenge().then(c => {
      if (c) setChallenge(c)
      else setError(true)
      setLoading(false)
    })
  }, [])

  if (loading) return <LoadingSkeleton dayNumber={dayNumber} />

  if (error || !challenge) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-sm text-gray-500 text-center">Could not load challenge. Try again later.</p>
        <Link href="/" className="text-sm font-semibold text-[#D85A30] hover:underline">
          ← Back to home
        </Link>
      </div>
    )
  }

  const diff = difficultyConfig[challenge.difficulty] ?? difficultyConfig.medium

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1 max-w-md mx-auto w-full px-4 py-6 pb-10">

        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors mb-6"
        >
          <BackIcon className="w-4 h-4" />
          Back to calendar
        </Link>

        {/* Day badge */}
        <div className="flex items-center gap-3 mb-4">
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#D85A30] text-white font-black text-lg shadow-md">
            {dayNumber}
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Day {dayNumber} of 30
            </p>
            <p className="text-xs text-gray-400">{challenge.category}</p>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-black text-gray-900 leading-tight mb-3">
          {challenge.title}
        </h1>

        {/* Meta tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          <MetaTag icon={<ClockIcon />} label={challenge.estimatedTime} />
          <MetaTag icon={<CompassIcon />} label={challenge.category} />
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${diff.color} ${diff.bg} ${diff.border}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {diff.label}
          </span>
        </div>

        {/* Description card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
            The Challenge
          </h2>
          <p className="text-base text-gray-700 leading-relaxed">
            {challenge.description}
          </p>
        </div>

        {/* Tips card */}
        <div className="bg-orange-50 rounded-2xl border border-orange-100 p-5 mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[#D85A30] mb-3">
            Tips for success
          </h2>
          <ul className="space-y-2">
            {getTips(challenge.category).map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-[#D85A30] shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <button className="w-full bg-[#D85A30] hover:bg-[#c04f28] active:bg-[#a8431f] text-white font-bold py-4 rounded-2xl transition-colors text-base tracking-wide shadow-md">
          Mark as Complete
        </button>

        <p className="text-center text-xs text-gray-400 mt-3">
          Completed challenges count toward your streak
        </p>
      </main>
    </div>
  )
}

// ── Loading skeleton ───────────────────────────────────────────

function LoadingSkeleton({ dayNumber: _ }: { dayNumber: number }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1 max-w-md mx-auto w-full px-4 py-6 pb-10 animate-pulse">
        <div className="h-5 w-32 bg-gray-200 rounded mb-6" />
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-[#D85A30] opacity-40" />
          <div className="space-y-1.5">
            <div className="h-3 w-24 bg-gray-200 rounded" />
            <div className="h-3 w-16 bg-gray-100 rounded" />
          </div>
        </div>
        <div className="h-9 w-3/4 bg-gray-200 rounded mb-3" />
        <div className="flex gap-2 mb-6">
          <div className="h-7 w-20 bg-gray-100 rounded-full" />
          <div className="h-7 w-20 bg-gray-100 rounded-full" />
        </div>
        <div className="bg-white rounded-2xl p-5 mb-5 space-y-2">
          <div className="h-3 w-24 bg-gray-100 rounded" />
          <div className="h-4 bg-gray-100 rounded w-full" />
          <div className="h-4 bg-gray-100 rounded w-5/6" />
          <div className="h-4 bg-gray-100 rounded w-4/5" />
        </div>
        <div className="h-14 bg-gray-200 rounded-2xl" />
      </main>
    </div>
  )
}

// ── Category tips ──────────────────────────────────────────────

function getTips(category: string): string[] {
  const tips: Record<string, string[]> = {
    'Food & Culture': [
      'Go in with no expectations — the goal is experience, not a great meal.',
      'Ask questions. Vendors and restaurant owners love talking about their craft.',
      'Bring cash. Many small vendors prefer it.',
    ],
    Outdoors: [
      'Check the weather the night before and dress one layer warmer than you think.',
      'Tell someone where you\'re going if it\'s a trail or remote area.',
      'Leave your phone in your pocket — look up more than down.',
    ],
    Mindfulness: [
      'Set a timer so you don\'t watch the clock.',
      'If your mind wanders, that\'s normal — just notice and return.',
      'Write a few lines about how you felt afterward.',
    ],
    Social: [
      'The awkward opener is always the hardest part — commit to it.',
      'Ask open questions, not yes/no ones.',
      'Listen more than you talk.',
    ],
    Fitness: [
      'Show up as a beginner — don\'t pretend you know more than you do.',
      'Warm up properly to avoid injury on an unfamiliar movement.',
      'Focus on learning the form, not the intensity.',
    ],
    Creativity: [
      'Set a time limit — constraints make you more creative, not less.',
      'Ship the imperfect thing. Done beats perfect.',
      'Keep what you make, no matter how rough it is.',
    ],
    Culture: [
      'Go alone if you can — you pay more attention without a companion.',
      'Pick one thing and really look at it rather than skimming everything.',
      'Read the context cards. Half the experience is in the backstory.',
    ],
    Exploration: [
      'Leave a bit of battery but resist the urge to map everything.',
      'Walk slower than you normally would.',
      'Look up at buildings — most people only look straight ahead.',
    ],
    nature: [
      'Check the weather the night before and dress one layer warmer than you think.',
      'Leave your phone in your pocket — look up more than down.',
      'Notice something small: a plant, an insect, the light.',
    ],
    fitness: [
      'Show up as a beginner — don\'t pretend you know more than you do.',
      'Warm up properly to avoid injury on an unfamiliar movement.',
      'Focus on form, not intensity.',
    ],
    social: [
      'The awkward opener is always the hardest part — commit to it.',
      'Ask open questions, not yes/no ones.',
      'Listen more than you talk.',
    ],
    creative: [
      'Set a time limit — constraints make you more creative, not less.',
      'Ship the imperfect thing. Done beats perfect.',
      'Keep what you make, no matter how rough it is.',
    ],
    food: [
      'Go in with no expectations — the goal is experience, not a great meal.',
      'Ask questions. Staff love talking about what they make.',
      'Bring cash. Many small vendors prefer it.',
    ],
    culture: [
      'Go alone if you can — you pay more attention without a companion.',
      'Pick one thing and really look at it rather than skimming everything.',
      'Read the context cards. Half the experience is in the backstory.',
    ],
  }

  return tips[category] ?? [
    'Commit fully — half-measures don\'t count.',
    'Notice what surprises you.',
    'Tell someone about it afterward.',
  ]
}

// ── Sub-components ─────────────────────────────────────────────

function MetaTag({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-white text-gray-600 text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
      <span className="w-3.5 h-3.5 shrink-0 text-[#D85A30]">{icon}</span>
      {label}
    </span>
  )
}

function BackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M5 12l7 7M5 12l7-7" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  )
}

function CompassIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  )
}
