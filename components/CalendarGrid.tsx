'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export default function CalendarGrid({
  completedDates = [],
  todayDayNumber = 1,
}: {
  completedDates?: string[]
  todayDayNumber?: number
}) {
  const today      = new Date()
  const todayStr   = today.toISOString().split('T')[0]
  const [viewYear, setViewYear]   = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth()
  const completedSet   = useMemo(() => new Set(completedDates), [completedDates])

  const firstDay    = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const todayLabel = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)",
      }}
    >
      {isCurrentMonth && (
        <p className="text-[11px] font-medium mb-3" style={{ color: "var(--foreground)", opacity: 0.4 }}>
          Today is{" "}
          <span className="font-semibold" style={{ opacity: 1, color: "var(--foreground)" }}>
            {todayLabel}
          </span>
        </p>
      )}

      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg transition-opacity text-lg leading-none"
          style={{ color: "var(--foreground)", opacity: 0.35 }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '0.35')}
        >
          ‹
        </button>
        <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button
          onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg transition-opacity text-lg leading-none"
          style={{ color: "var(--foreground)", opacity: 0.35 }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '0.35')}
        >
          ›
        </button>
      </div>

      {/* Day-of-week labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map(d => (
          <div
            key={d}
            className="text-center text-[9px] font-semibold py-1 uppercase tracking-[0.1em]"
            style={{ color: "var(--foreground)", opacity: 0.3 }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-[3px]">
        {Array.from({ length: firstDay }, (_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {Array.from({ length: daysInMonth }, (_, i) => {
          const dayNum  = i + 1
          const dateKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
          const isToday  = dateKey === todayStr
          const isDone   = completedSet.has(dateKey)
          const isFuture = dateKey > todayStr

          if (isToday) {
            return (
              <Link
                key={dayNum}
                href={`/challenge/${todayDayNumber}`}
                className="aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-bold select-none"
                style={{
                  border: "2px solid #D85A30",
                  color: "#D85A30",
                  background: "var(--accent-light)",
                  boxShadow: "0 0 0 3px rgba(216,90,48,0.12)",
                }}
              >
                <span className="text-[10px] leading-none font-black">{dayNum}</span>
                <span className="text-[7px] leading-none mt-0.5 font-semibold uppercase tracking-wide opacity-70">
                  Today
                </span>
              </Link>
            )
          }

          if (isDone) {
            return (
              <div
                key={dayNum}
                className="aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-bold select-none"
                style={{
                  background: "linear-gradient(135deg, #D85A30 0%, #f97316 100%)",
                  color: "#fff",
                  boxShadow: "0 2px 6px rgba(216,90,48,0.25)",
                }}
              >
                <span className="text-[8px] leading-none opacity-75">{dayNum}</span>
                <span className="text-[11px] leading-none mt-px">✓</span>
              </div>
            )
          }

          if (isFuture) {
            return (
              <div
                key={dayNum}
                className="aspect-square flex flex-col items-center justify-center rounded-lg select-none"
                style={{ color: "var(--foreground)", opacity: 0.15 }}
              >
                <span className="text-[10px] font-bold leading-none">{dayNum}</span>
                <LockIcon className="w-2.5 h-2.5 mt-0.5" />
              </div>
            )
          }

          // Past, not completed — "missed"
          return (
            <div
              key={dayNum}
              className="aspect-square flex items-center justify-center rounded-lg text-xs font-bold select-none"
              style={{ color: "var(--foreground)", opacity: 0.28 }}
            >
              {dayNum}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  )
}
