'use client'

import Link from 'next/link'
import { Clock, MapPin } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StaggerList, StaggerItem, ScaleTap } from '@/components/ui/motion'
import { formatTime } from '@/lib/utils'
import { SESSION_STATUS_LABELS, SESSION_STATUS_VARIANTS } from '@/lib/constants'
import type { SessionWithClient } from '@/types'

interface TodaySessionsProps {
  sessions: SessionWithClient[]
}

export function TodaySessions({ sessions }: TodaySessionsProps) {
  return (
    <StaggerList className="space-y-3">
      {sessions.map((session) => (
        <StaggerItem key={session.id}>
        <ScaleTap>
        <Link href={`/sessions/${session.id}`}>
          <Card className="flex items-center gap-4 p-4 transition-colors hover:bg-elevated">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-elevated">
              <Clock className="h-5 w-5 text-text-secondary" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-medium text-text-primary truncate">
                  {session.clients?.name}
                </p>
                <Badge variant={SESSION_STATUS_VARIANTS[session.status]}>
                  {SESSION_STATUS_LABELS[session.status]}
                </Badge>
              </div>
              <div className="mt-1 flex items-center gap-3 text-sm text-text-secondary">
                <span>{formatTime(session.scheduled_at)}</span>
                {session.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" strokeWidth={1.5} />
                    {session.location}
                  </span>
                )}
              </div>
            </div>
          </Card>
        </Link>
        </ScaleTap>
        </StaggerItem>
      ))}
    </StaggerList>
  )
}
