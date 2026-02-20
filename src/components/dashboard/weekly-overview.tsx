'use client'

import { isToday } from 'date-fns'
import { cn } from '@/lib/utils'

const DAY_LABELS = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne']

interface WeeklyOverviewProps {
  weekSessionsByDay: { day: string; count: number }[]
}

export function WeeklyOverview({ weekSessionsByDay }: WeeklyOverviewProps) {
  return (
    <div className="grid grid-cols-7 gap-2">
      {weekSessionsByDay.map((entry, i) => {
        const today = isToday(new Date(entry.day))
        return (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <span
              className={cn(
                'text-xs font-medium',
                today ? 'text-accent' : 'text-text-tertiary'
              )}
            >
              {DAY_LABELS[i]}
            </span>
            <div
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold',
                today
                  ? 'bg-accent text-black'
                  : entry.count > 0
                    ? 'bg-card text-text-primary'
                    : 'bg-card text-text-tertiary'
              )}
            >
              {entry.count}
            </div>
          </div>
        )
      })}
    </div>
  )
}
