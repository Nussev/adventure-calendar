'use client'

import { useState } from 'react'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function CalendarGrid({
  completedDays = 0,
}: {
  totalDays?: number
  completedDays?: number
  activeDay?: number
}) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth()

  const completedDates = new Set<string>()
  for (let i = 0; i < completedDays; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    completedDates.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`)
  }

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
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
          className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors text-lg leading-none"
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
          className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors text-lg leading-none"
          style={{ color: "var(--foreground)", opacity: 0.35 }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '0.35')}
        >
          ›
        </button>
      </div>

      {/* Day labels */}
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
          const dayNum = i + 1
          const key = `${viewYear}-${viewMonth}-${dayNum}`
          const isToday = isCurrentMonth && dayNum === today.getDate()
          const isDone = completedDates.has(key)
          const isFuture = isCurrentMonth && dayNum > today.getDate()

          return (
            <div
              key={dayNum}
              className="aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-bold select-none transition-transform"
              style={
                isDone
                  ? {
                      background: "linear-gradient(135deg, #D85A30 0%, #f97316 100%)",
                      color: "#fff",
                      boxShadow: "0 2px 6px rgba(216,90,48,0.25)",
                    }
                  : isToday
                  ? {
                      border: "2px solid #D85A30",
                      color: "#D85A30",
                      background: "var(--accent-light)",
                      boxShadow: "0 0 0 3px rgba(216,90,48,0.12)",
                    }
                  : isFuture
                  ? { color: "var(--foreground)", opacity: 0.18 }
                  : { color: "var(--foreground)", opacity: 0.35 }
              }
            >
              {isDone ? (
                <>
                  <span className="text-[8px] leading-none opacity-75">{dayNum}</span>
                  <span className="text-[12px] leading-none mt-px">✓</span>
                </>
              ) : (
                <span>{dayNum}</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
