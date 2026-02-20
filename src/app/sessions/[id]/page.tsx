import { notFound } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { getSession } from '@/lib/actions/sessions'
import type { SessionWithDetails } from '@/types'
import { getSessionExercises } from '@/lib/actions/session-exercises'
import { formatDateTime, formatTime, getSupersetLabels, groupExercisesForRender } from '@/lib/utils'
import { toPragueDate } from '@/lib/datetime'
import { SESSION_STATUS_LABELS, SESSION_STATUS_VARIANTS, SESSION_DURATION_MINUTES } from '@/lib/constants'
import { SessionDetailActions } from './session-detail-actions'

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let session
  try {
    session = await getSession(id)
  } catch {
    notFound()
  }

  const exercises = await getSessionExercises(id)

  const clientName = (session.clients as { id: string; name: string })?.name || 'Klient'
  const clientId = (session.clients as { id: string; name: string })?.id || ''
  const pkg = session.packages as { id: string; name: string; total_sessions: number; used_sessions: number } | null
  const startTime = toPragueDate(session.scheduled_at)
  const endTime = new Date(startTime.getTime() + SESSION_DURATION_MINUTES * 60000)

  return (
    <AppShell>
      <PageHeader title={clientName} backHref="/calendar" />

      <PageTransition>
      <div className="space-y-4 px-4">
        {/* Session info */}
        <Card>
          <CardContent className="space-y-3 py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Stav</span>
              <Badge variant={SESSION_STATUS_VARIANTS[session.status]}>
                {SESSION_STATUS_LABELS[session.status]}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Datum a čas</span>
              <span className="text-sm text-text-primary">
                {formatDateTime(session.scheduled_at)} – {formatTime(endTime)}
              </span>
            </div>
            {pkg && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Balíček</span>
                <span className="text-sm text-text-primary">
                  {pkg.name} ({pkg.used_sessions}/{pkg.total_sessions})
                </span>
              </div>
            )}
            {session.notes && (
              <div>
                <span className="text-sm text-text-secondary">Poznámky</span>
                <p className="mt-1 text-sm text-text-primary">{session.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <SessionDetailActions
          sessionId={session.id}
          clientId={clientId}
          status={session.status}
          scheduledAt={session.scheduled_at}
          recurrenceGroupId={(session as SessionWithDetails & { recurrence_group_id?: string | null }).recurrence_group_id || null}
          exercises={(exercises || []) as ExerciseWithRelation[]}
        />

        {/* Read-only exercises for cancelled/no_show sessions (completed sessions use the editor above) */}
        {(session.status === 'cancelled' || session.status === 'no_show') && exercises && exercises.length > 0 && (
          <ReadOnlyExercises exercises={exercises as ExerciseWithRelation[]} />
        )}
      </div>
      </PageTransition>
    </AppShell>
  )
}

type ExerciseWithRelation = {
  id: string
  session_id: string
  exercise_id: string
  order_index: number
  sets: { reps: number; weight: number }[]
  notes: string | null
  superset_group: number | null
  exercises: { id: string; name: string }
}

function ReadOnlyExercises({ exercises }: { exercises: ExerciseWithRelation[] }) {
  const labels = getSupersetLabels(exercises)
  const renderGroups = groupExercisesForRender(exercises)

  function ExerciseCard({ ex }: { ex: ExerciseWithRelation }) {
    const sets = ex.sets || []
    const exerciseName = ex.exercises?.name || 'Cvik'
    const label = labels.get(ex.id)
    return (
      <Card>
        <CardContent className="py-3">
          <div className="mb-2 flex items-center gap-2">
            {label && (
              <span className="rounded-md bg-warning/20 px-1.5 py-0.5 text-xs font-medium text-warning">
                {label}
              </span>
            )}
            <h3 className="text-sm font-semibold text-text-primary">{exerciseName}</h3>
          </div>
          {sets.length > 0 && (
            <div className="space-y-1">
              {sets.map((set, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                  <span className="w-6 text-text-tertiary">{i + 1}.</span>
                  <span>{set.reps} x {set.weight} kg</span>
                </div>
              ))}
            </div>
          )}
          {ex.notes && (
            <p className="mt-2 text-xs text-text-tertiary">{ex.notes}</p>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div>
      <h2 className="mb-3 font-heading text-lg font-semibold text-text-primary">Cviky</h2>
      <div className="space-y-3">
        {renderGroups.map((group) => {
          if (group.type === 'superset' && group.exercises.length > 1) {
            return (
              <div key={`ss-${group.group}`} className="rounded-2xl border border-warning/30 bg-warning/5 p-2">
                <p className="mb-2 px-2 text-xs font-medium text-warning">Superset</p>
                <div className="space-y-2">
                  {group.exercises.map((ex) => (
                    <ExerciseCard key={ex.id} ex={ex} />
                  ))}
                </div>
              </div>
            )
          }
          return group.exercises.map((ex) => (
            <ExerciseCard key={ex.id} ex={ex} />
          ))
        })}
      </div>
    </div>
  )
}
