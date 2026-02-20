'use client'

import { useMemo } from 'react'
import { format, addDays, isSameDay } from 'date-fns'
import { cs } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { SESSION_DURATION_MINUTES } from '@/lib/constants'
import { toPragueDate } from '@/lib/datetime'
import type { SessionWithClient } from '@/types'

interface CalendarDayViewProps {
  sessions: SessionWithClient[]
  currentDate: Date
  onDateChange: (date: Date) => void
}

const START_HOUR = 6
const END_HOUR = 22
const HOUR_HEIGHT = 64 // px per hour

export function CalendarDayView({ sessions, currentDate, onDateChange }: CalendarDayViewProps) {

  const currentDatePrague = toPragueDate(currentDate)
  const daySessions = useMemo(
    () => sessions.filter((s) => isSameDay(toPragueDate(s.scheduled_at), currentDatePrague)),
    [sessions, currentDatePrague]
  )

  const today = isSameDay(currentDatePrague, toPragueDate(new Date()))

  const { startHour, endHour } = useMemo(() => {
    if (daySessions.length === 0) {
      return { startHour: START_HOUR, endHour: END_HOUR }
    }
    let earliest = START_HOUR * 60
    let latest = END_HOUR * 60
    for (const session of daySessions) {
      const start = toPragueDate(session.scheduled_at)
      const startMinutes = start.getHours() * 60 + start.getMinutes()
      const endMinutes = startMinutes + SESSION_DURATION_MINUTES
      if (startMinutes < earliest) earliest = startMinutes
      if (endMinutes > latest) latest = endMinutes
    }
    const startHour = Math.max(0, Math.floor(earliest / 60))
    const endHour = Math.min(24, Math.ceil(latest / 60))
    return { startHour, endHour }
  }, [daySessions])

  const totalHours = Math.max(1, endHour - startHour)
  const hours = Array.from({ length: totalHours }, (_, i) => startHour + i)

  return (
    <div>
      <div className="flex items-center justify-between px-4 pb-4">
        <button
          onClick={() => onDateChange(addDays(currentDate, -1))}
          className="rounded-lg p-2 text-text-secondary transition-colors hover:text-text-primary"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
        </button>
        <span className={cn('text-sm font-medium', today ? 'text-text-primary' : 'text-text-secondary')}>
          {format(currentDatePrague, 'EEEE, d. MMMM yyyy', { locale: cs })}
        </span>
        <button
          onClick={() => onDateChange(addDays(currentDate, 1))}
          className="rounded-lg p-2 text-text-secondary transition-colors hover:text-text-primary"
        >
          <ChevronRight className="h-5 w-5" strokeWidth={1.5} />
        </button>
      </div>

      <div className="relative mx-4 overflow-y-auto" style={{ height: `${totalHours * HOUR_HEIGHT}px` }}>
        {/* Hour lines */}
        {hours.map((hour) => (
          <div
            key={hour}
            className="absolute left-0 right-0 border-t border-border"
            style={{ top: `${(hour - startHour) * HOUR_HEIGHT}px` }}
          >
            <span className="absolute -top-2.5 left-0 text-xs text-text-tertiary">
              {String(hour).padStart(2, '0')}:00
            </span>
          </div>
        ))}

        {/* Sessions */}
        {daySessions.map((session) => {
          const start = toPragueDate(session.scheduled_at)
          const hour = start.getHours()
          const minute = start.getMinutes()
          const top = (hour - startHour) * HOUR_HEIGHT + (minute / 60) * HOUR_HEIGHT
          const height = (SESSION_DURATION_MINUTES / 60) * HOUR_HEIGHT

          return (
            <Link
              key={session.id}
              href={`/sessions/${session.id}`}
              className="absolute left-12 right-0 rounded-lg border border-border bg-card px-3 py-2 transition-colors hover:border-border-hover"
              style={{ top: `${top}px`, height: `${height}px` }}
            >
              <p className="text-sm font-medium text-text-primary">{session.clients?.name}</p>
              <p className="text-xs text-text-secondary">
                {format(start, 'HH:mm', { locale: cs })} – {format(toPragueDate(new Date(start.getTime() + SESSION_DURATION_MINUTES * 60000)), 'HH:mm', { locale: cs })}
              </p>
              {session.location && (
                <p className="mt-0.5 truncate text-xs text-text-tertiary">{session.location}</p>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
