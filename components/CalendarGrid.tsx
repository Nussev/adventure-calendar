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

  // Build set of completed date strings (working backwards from today)
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
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      {isCurrentMonth && (
        <p className="text-xs text-gray-400 font-medium mb-3">
          Today is <span className="text-gray-600 font-semibold">{todayLabel}</span>
        </p>
      )}

      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
        >
          ‹
        </button>
        <span className="text-sm font-bold text-gray-900">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button
          onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
        >
          ›
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-gray-400 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
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
              className={[
                'aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-bold select-none',
                isDone
                  ? 'bg-[#D85A30] text-white shadow-sm'
                  : isToday
                  ? 'border-2 border-[#D85A30] text-[#D85A30] bg-orange-50 ring-2 ring-[#D85A30]/20'
                  : isFuture
                  ? 'text-gray-300'
                  : 'text-gray-400',
              ].join(' ')}
            >
              {isDone ? (
                <>
                  <span className="text-[9px] leading-none opacity-70">{dayNum}</span>
                  <span className="text-sm leading-none">✓</span>
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
