'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getDailyChallenge, type DailyChallenge, type VenueStop } from '@/lib/getDailyChallenge'

const difficultyConfig = {
  easy:   { label: 'Easy',   color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20',  border: 'border-green-200 dark:border-green-800' },
  medium: { label: 'Medium', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20',  border: 'border-amber-200 dark:border-amber-800' },
  hard:   { label: 'Hard',   color: 'text-red-600 dark:text-red-400',     bg: 'bg-red-50 dark:bg-red-900/20',     border: 'border-red-200 dark:border-red-800'     },
} as const

export default function ChallengePage() {
  const { day } = useParams<{ day: string }>()
  const dayNumber = parseInt(day, 10)
  const router = useRouter()

  const [challenge, setChallenge]     = useState<DailyChallenge | null>(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(false)
  const [completing, setCompleting]   = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  useEffect(() => {
    getDailyChallenge().then(c => {
      if (c) {
        setChallenge(c)
        setIsCompleted(c.is_completed ?? false)
      } else {
        setError(true)
      }
      setLoading(false)
    })
  }, [])

  async function handleComplete() {
    if (!challenge?.id || completing || isCompleted) return
    setCompleting(true)
    try {
      const res = await fetch('/api/complete-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId: challenge.id, dayNumber }),
      })
      if (res.ok) {
        setIsCompleted(true)
        setTimeout(() => router.push('/'), 1200)
      }
    } finally {
      setCompleting(false)
    }
  }

  if (loading) return <LoadingSkeleton dayNumber={dayNumber} />

  if (error || !challenge) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4" style={{ background: "var(--background)" }}>
        <p className="text-sm text-center" style={{ color: "var(--foreground)", opacity: 0.5 }}>
          Could not load challenge. Try again later.
        </p>
        <Link href="/" className="text-sm font-semibold text-[#D85A30] hover:underline">
          ← Back to home
        </Link>
      </div>
    )
  }

  const diff = difficultyConfig[challenge.difficulty] ?? difficultyConfig.medium
  const stops = challenge.venue_stops ?? []

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--background)" }}>
      <main className="flex-1 max-w-md mx-auto w-full px-4 py-6 pb-12">

        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors mb-6"
          style={{ color: "var(--foreground)", opacity: 0.4 }}
        >
          <BackIcon className="w-4 h-4" />
          Back to calendar
        </Link>

        {/* Day badge */}
        <div className="flex items-center gap-3 mb-4">
          <span
            className="inline-flex items-center justify-center w-12 h-12 rounded-2xl text-white font-black text-lg"
            style={{
              background: "linear-gradient(135deg, #D85A30 0%, #f97316 100%)",
              boxShadow: "0 4px 12px rgba(216,90,48,0.3)",
            }}
          >
            {dayNumber}
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--foreground)", opacity: 0.4 }}>
              Day {dayNumber} of 30
            </p>
            <p className="text-xs font-medium" style={{ color: "var(--foreground)", opacity: 0.5 }}>{challenge.category}</p>
          </div>
        </div>

        {/* Title */}
        <h1
          className="text-[1.9rem] font-black leading-tight mb-3"
          style={{ color: "var(--foreground)" }}
        >
          {challenge.title}
        </h1>

        {/* Meta tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          <MetaTag icon={<ClockIcon />} label={challenge.estimated_duration ?? challenge.estimatedTime} />
          {challenge.estimated_cost && <MetaTag icon={<CostIcon />} label={challenge.estimated_cost} />}
          {challenge.time_of_day    && <MetaTag icon={<SunIcon />}  label={challenge.time_of_day} />}
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${diff.color} ${diff.bg} ${diff.border}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {diff.label}
          </span>
        </div>

        {/* Description */}
        <div
          className="rounded-2xl p-5 mb-5"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] mb-3 text-[#D85A30]">
            The Adventure
          </h2>
          <p className="text-base leading-relaxed" style={{ color: "var(--foreground)", opacity: 0.75 }}>
            {challenge.description}
          </p>
        </div>

        {/* ── Venue stops ── */}
        {stops.length > 0 && (
          <section className="mb-6">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] mb-3" style={{ color: "var(--foreground)", opacity: 0.4 }}>
              Your {stops.length} stops
            </h2>
            <div className="space-y-3">
              {stops.map(stop => (
                <VenueStopCard key={stop.order} stop={stop} />
              ))}
            </div>
          </section>
        )}

        {/* Tips — only shown when there are no structured stops */}
        {stops.length === 0 && (
          <div
            className="rounded-2xl p-5 mb-6"
            style={{
              background: "var(--accent-light)",
              border: "1px solid rgba(216,90,48,0.15)",
            }}
          >
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#D85A30] mb-3">
              Tips for success
            </h2>
            <ul className="space-y-2">
              {getTips(challenge.category).map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--foreground)", opacity: 0.7 }}>
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#D85A30] shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handleComplete}
          disabled={completing || isCompleted}
          className="w-full text-white font-bold py-4 rounded-2xl text-base tracking-wide transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-default"
          style={{
            background: isCompleted
              ? "linear-gradient(135deg, #16a34a 0%, #22c55e 100%)"
              : "linear-gradient(135deg, #D85A30 0%, #e8693e 100%)",
            boxShadow: isCompleted
              ? "0 4px 16px rgba(22,163,74,0.3)"
              : "0 4px 16px rgba(216,90,48,0.35)",
          }}
        >
          {isCompleted ? '✓ Completed!' : completing ? 'Saving…' : 'Mark as Complete'}
        </button>

        <p className="text-center text-xs mt-3" style={{ color: "var(--foreground)", opacity: 0.35 }}>
          Completed challenges count toward your streak
        </p>
      </main>
    </div>
  )
}

// ── Venue stop card ────────────────────────────────────────────────────────────

function VenueStopCard({ stop }: { stop: VenueStop }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      {/* Stop number stripe */}
      <div
        className="h-[3px]"
        style={{ background: "linear-gradient(90deg, #D85A30, #f97316, #fbbf24)" }}
      />

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span
              className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black text-white shrink-0"
              style={{ background: "linear-gradient(135deg, #D85A30, #f97316)" }}
            >
              {stop.order}
            </span>
            <div>
              <p className="text-sm font-bold leading-tight" style={{ color: "var(--foreground)" }}>
                {stop.venue_name}
              </p>
              <p className="text-[11px]" style={{ color: "var(--foreground)", opacity: 0.45 }}>
                {stop.venue_type}
              </p>
            </div>
          </div>

          {/* Rating + price */}
          <div className="text-right shrink-0">
            {stop.google_rating && (
              <p className="text-xs font-bold text-[#D85A30]">
                ★ {stop.google_rating}
                {stop.review_count && (
                  <span className="font-normal ml-0.5" style={{ color: "var(--foreground)", opacity: 0.4 }}>
                    ({stop.review_count >= 1000
                      ? `${(stop.review_count / 1000).toFixed(1)}k`
                      : stop.review_count})
                  </span>
                )}
              </p>
            )}
            {stop.price_level && (
              <p className="text-[11px] font-semibold" style={{ color: "var(--foreground)", opacity: 0.45 }}>
                {stop.price_level}
              </p>
            )}
          </div>
        </div>

        {/* Address */}
        <p className="text-[11px] mb-3 flex items-start gap-1.5" style={{ color: "var(--foreground)", opacity: 0.45 }}>
          <PinIcon className="w-3 h-3 mt-0.5 shrink-0 text-[#D85A30]" />
          {stop.venue_address}
        </p>

        {/* What to do */}
        <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--foreground)", opacity: 0.75 }}>
          {stop.what_to_do}
        </p>

        {/* Tip */}
        {stop.tip && (
          <div
            className="rounded-xl px-3 py-2 flex items-start gap-2"
            style={{ background: "var(--accent-light)" }}
          >
            <span className="text-[#D85A30] text-xs mt-0.5 shrink-0">💡</span>
            <p className="text-xs" style={{ color: "var(--foreground)", opacity: 0.7 }}>
              {stop.tip}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function LoadingSkeleton({ dayNumber: _ }: { dayNumber: number }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--background)" }}>
      <main className="flex-1 max-w-md mx-auto w-full px-4 py-6 pb-10 animate-pulse">
        <div className="h-5 w-32 rounded mb-6" style={{ background: "var(--muted)" }} />
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl" style={{ background: "rgba(216,90,48,0.25)" }} />
          <div className="space-y-1.5">
            <div className="h-3 w-24 rounded" style={{ background: "var(--muted)" }} />
            <div className="h-3 w-16 rounded" style={{ background: "var(--locked-bg)" }} />
          </div>
        </div>
        <div className="h-9 w-3/4 rounded mb-3" style={{ background: "var(--muted)" }} />
        <div className="flex gap-2 mb-6">
          <div className="h-7 w-20 rounded-full" style={{ background: "var(--locked-bg)" }} />
          <div className="h-7 w-20 rounded-full" style={{ background: "var(--locked-bg)" }} />
        </div>
        <div className="rounded-2xl p-5 mb-4 space-y-2" style={{ background: "var(--muted)" }}>
          <div className="h-3 w-24 rounded" style={{ background: "var(--muted)" }} />
          <div className="h-4 w-full rounded" style={{ background: "var(--locked-bg)" }} />
          <div className="h-4 w-5/6 rounded" style={{ background: "var(--locked-bg)" }} />
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-2xl mb-3 overflow-hidden" style={{ background: "var(--muted)" }}>
            <div className="h-[3px] w-full" style={{ background: "rgba(216,90,48,0.2)" }} />
            <div className="p-4 space-y-2">
              <div className="h-4 w-1/2 rounded" style={{ background: "var(--muted)" }} />
              <div className="h-3 w-1/3 rounded" style={{ background: "var(--locked-bg)" }} />
              <div className="h-3 w-full rounded" style={{ background: "var(--locked-bg)" }} />
            </div>
          </div>
        ))}
        <div className="h-14 rounded-2xl" style={{ background: "rgba(216,90,48,0.15)" }} />
      </main>
    </div>
  )
}

// ── Helper: tips when no structured stops ─────────────────────────────────────

function getTips(category: string): string[] {
  const tips: Record<string, string[]> = {
    'Food & drink': [
      'Go in with no expectations — the goal is experience, not a great meal.',
      'Ask questions. Staff love talking about what they make.',
      'Bring cash. Many small vendors prefer it.',
    ],
    Outdoors: [
      'Check the weather the night before.',
      'Tell someone where you\'re going if it\'s a trail.',
      'Look up more than down.',
    ],
    Social: [
      'The awkward opener is always the hardest part — commit to it.',
      'Ask open questions, not yes/no ones.',
      'Listen more than you talk.',
    ],
    Fitness: [
      'Show up as a beginner.',
      'Warm up properly.',
      'Focus on form, not intensity.',
    ],
  }
  return tips[category] ?? [
    'Commit fully — half-measures don\'t count.',
    'Notice what surprises you.',
    'Tell someone about it afterward.',
  ]
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MetaTag({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border"
      style={{
        background: "var(--card)",
        color: "var(--foreground)",
        borderColor: "var(--border)",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
      }}
    >
      <span className="w-3.5 h-3.5 shrink-0 text-[#D85A30]">{icon}</span>
      <span style={{ opacity: 0.75 }}>{label}</span>
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
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
}
function CostIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>
}
function SunIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></svg>
}
function CompassIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" /></svg>
}
function PinIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
}
