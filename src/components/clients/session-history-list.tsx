'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Calendar, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Loading } from '@/components/ui/loading'
import { SESSION_STATUS_LABELS } from '@/lib/constants'
import { formatDate, formatTime } from '@/lib/utils'
import type { Session } from '@/types'

interface SessionHistoryListProps {
  clientId: string
}

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  scheduled: 'default',
  completed: 'success',
  cancelled: 'danger',
  no_show: 'warning',
}

export function SessionHistoryList({ clientId }: SessionHistoryListProps) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('sessions')
        .select('*')
        .eq('client_id', clientId)
        .order('scheduled_at', { ascending: false })
      setSessions(data ?? [])
      setLoading(false)
    }
    load()
  }, [clientId])

  if (loading) return <Loading className="py-12" />

  if (sessions.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="Žádné tréninky"
        description="Tento klient zatím nemá žádné tréninky."
      />
    )
  }

  return (
    <div className="space-y-2">
      {sessions.map((session) => (
        <Link key={session.id} href={`/sessions/${session.id}`}>
          <Card className="transition-colors hover:border-border-hover">
            <CardContent className="flex items-center justify-between py-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-text-primary">
                    {formatDate(session.scheduled_at)}
                  </span>
                  <span className="text-sm text-text-secondary">
                    {formatTime(session.scheduled_at)}
                  </span>
                </div>
                <Badge
                  variant={statusVariant[session.status] ?? 'default'}
                  className="mt-1"
                >
                  {SESSION_STATUS_LABELS[session.status]}
                </Badge>
              </div>
              <ChevronRight className="h-4 w-4 text-text-tertiary" strokeWidth={1.5} />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
