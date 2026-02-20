'use client'

import { useMemo } from 'react'
import { format, startOfWeek, addDays, isSameDay } from 'date-fns'
import { cs } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toPragueDate } from '@/lib/datetime'
import { SessionCard } from './session-card'
import type { SessionWithClient } from '@/types'

interface CalendarWeekViewProps {
  sessions: SessionWithClient[]
  currentDate: Date
  onDateChange: (date: Date) => void
  onDayClick?: (date: Date) => void
}

export function CalendarWeekView({ sessions, currentDate, onDateChange, onDayClick }: CalendarWeekViewProps) {
  const weekStart = startOfWeek(toPragueDate(currentDate), { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const sessionsByDay = useMemo(() => {
    const map = new Map<string, SessionWithClient[]>()
    for (const session of sessions) {
      const dayKey = format(toPragueDate(session.scheduled_at), 'yyyy-MM-dd')
      if (!map.has(dayKey)) map.set(dayKey, [])
      map.get(dayKey)!.push(session)
    }
    return map
  }, [sessions])

  return (
    <div>
      <div className="flex items-center justify-between px-4 pb-4">
        <button
          onClick={() => onDateChange(addDays(currentDate, -7))}
          aria-label="Předchozí týden"
          className="rounded-lg p-2 text-text-secondary transition-colors hover:text-text-primary"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
        </button>
        <span className="text-sm font-medium text-text-primary">
          {format(weekStart, 'd. M.', { locale: cs })} – {format(addDays(weekStart, 6), 'd. M. yyyy', { locale: cs })}
        </span>
        <button
          onClick={() => onDateChange(addDays(currentDate, 7))}
          aria-label="Následující týden"
          className="rounded-lg p-2 text-text-secondary transition-colors hover:text-text-primary"
        >
          <ChevronRight className="h-5 w-5" strokeWidth={1.5} />
        </button>
      </div>

      <div className="space-y-1 px-4">
        {weekDays.map((day) => {
          const dayKey = format(day, 'yyyy-MM-dd')
          const daySessions = sessionsByDay.get(dayKey) || []
          const today = isSameDay(toPragueDate(day), toPragueDate(new Date()))

          return (
            <div
              key={dayKey}
              className={cn(
                'rounded-xl p-3',
                today && 'bg-card ring-1 ring-border'
              )}
            >
              <div className="mb-2 flex items-center gap-2">
                <span
                  className={cn(
                    'text-xs font-medium uppercase',
                    today ? 'text-text-primary' : 'text-text-tertiary'
                  )}
                >
                  {format(day, 'EEEEEE', { locale: cs })}
                </span>
                <span
                  className={cn(
                    'text-sm font-medium',
                    today ? 'text-text-primary' : 'text-text-secondary'
                  )}
                >
                  {format(day, 'd. M.', { locale: cs })}
                </span>
                {daySessions.length > 0 && (
                  <span className="ml-auto text-xs text-text-tertiary">
                    {daySessions.length} {daySessions.length === 1 ? 'trénink' : daySessions.length < 5 ? 'tréninky' : 'tréninků'}
                  </span>
                )}
                {onDayClick && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDayClick(day) }}
                    aria-label="Přidat trénink"
                    className={cn(
                      'rounded-lg p-1 text-text-tertiary transition-colors hover:text-accent',
                      daySessions.length === 0 && 'ml-auto'
                    )}
                  >
                    <Plus className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                )}
              </div>
              {daySessions.length > 0 ? (
                <div className="space-y-1.5">
                  {daySessions.map((session) => (
                    <SessionCard key={session.id} session={session} />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-text-tertiary">Žádné tréninky</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
