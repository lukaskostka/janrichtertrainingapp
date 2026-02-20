'use client'

import Link from 'next/link'
import { formatTime } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { SESSION_STATUS_LABELS } from '@/lib/constants'
import type { SessionWithClient } from '@/types'

interface SessionCardProps {
  session: SessionWithClient
}

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
  scheduled: 'default',
  completed: 'success',
  cancelled: 'danger',
  no_show: 'warning',
}

export function SessionCard({ session }: SessionCardProps) {
  return (
    <Link
      href={`/sessions/${session.id}`}
      className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 transition-colors hover:border-border-hover"
    >
      <span className="text-sm font-medium text-text-primary">
        {formatTime(session.scheduled_at)}
      </span>
      <span className="flex-1 truncate text-sm text-text-secondary">
        {session.clients?.name}
      </span>
      {session.status !== 'scheduled' && (
        <Badge variant={statusVariant[session.status]}>
          {SESSION_STATUS_LABELS[session.status]}
        </Badge>
      )}
    </Link>
  )
}
