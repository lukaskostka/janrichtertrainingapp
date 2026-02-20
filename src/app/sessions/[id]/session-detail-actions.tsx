'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, UserX, CalendarClock, Trash2, Dumbbell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { ExerciseEditor } from '@/components/sessions/exercise-editor'
import { updateSessionStatus, updateSession, deleteSession, deleteFutureRecurringSessions } from '@/lib/actions/sessions'
import { hapticSuccess } from '@/lib/haptics'
import { toLocalInputValue, toUtcIsoFromLocalInput } from '@/lib/datetime'
import type { ExerciseSet } from '@/types'

interface ExerciseRecord {
  id: string
  exercise_id: string
  order_index: number
  sets: ExerciseSet[]
  notes: string | null
  superset_group: number | null
  exercises: { id: string; name: string }
}

interface SessionDetailActionsProps {
  sessionId: string
  clientId: string
  status: string
  scheduledAt: string
  recurrenceGroupId: string | null
  exercises: ExerciseRecord[]
}

export function SessionDetailActions({ sessionId, clientId, status, scheduledAt, recurrenceGroupId, exercises }: SessionDetailActionsProps) {
  const router = useRouter()
  const [editorOpen, setEditorOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [noShowOpen, setNoShowOpen] = useState(false)
  const [completeOpen, setCompleteOpen] = useState(false)
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [newDateTime, setNewDateTime] = useState(toLocalInputValue(scheduledAt))

  useEffect(() => {
    setNewDateTime(toLocalInputValue(scheduledAt))
  }, [scheduledAt])

  const isScheduled = status === 'scheduled'
  const isCompleted = status === 'completed'

  // For completed sessions, show only the exercise editor
  // For cancelled/no_show, show nothing
  if (!isScheduled && !isCompleted) return null

  async function handleComplete() {
    setLoading(true)
    try {
      await updateSessionStatus(sessionId, 'completed')
      hapticSuccess()
      router.refresh()
    } finally {
      setLoading(false)
      setCompleteOpen(false)
    }
  }

  async function handleCancel() {
    setLoading(true)
    try {
      await updateSessionStatus(sessionId, 'cancelled')
      router.refresh()
    } finally {
      setLoading(false)
      setCancelOpen(false)
    }
  }

  async function handleNoShow() {
    setLoading(true)
    try {
      await updateSessionStatus(sessionId, 'no_show')
      router.refresh()
    } finally {
      setLoading(false)
      setNoShowOpen(false)
    }
  }

  async function handleReschedule() {
    setLoading(true)
    try {
      await updateSession(sessionId, { scheduled_at: toUtcIsoFromLocalInput(newDateTime) })
      router.refresh()
    } finally {
      setLoading(false)
      setRescheduleOpen(false)
    }
  }

  async function handleDelete() {
    setLoading(true)
    try {
      await deleteSession(sessionId)
      router.push('/calendar')
    } finally {
      setLoading(false)
      setDeleteOpen(false)
    }
  }

  async function handleDeleteAllFuture() {
    setLoading(true)
    try {
      if (recurrenceGroupId) {
        await deleteFutureRecurringSessions(recurrenceGroupId, scheduledAt)
      }
      await deleteSession(sessionId)
      router.push('/calendar')
    } finally {
      setLoading(false)
      setDeleteOpen(false)
    }
  }

  return (
    <>
      <div className="space-y-2">
        {/* Exercise editor toggle */}
        <Button
          className="w-full"
          size="lg"
          variant={editorOpen ? 'secondary' : 'primary'}
          onClick={() => setEditorOpen(!editorOpen)}
        >
          <Dumbbell className="mr-2 h-4 w-4" strokeWidth={1.5} />
          {editorOpen ? 'Skrýt cviky' : 'Upravit cviky'}
        </Button>

        {editorOpen && (
          <div className="pt-2">
            <ExerciseEditor
              sessionId={sessionId}
              clientId={clientId}
              initialExercises={exercises}
            />
          </div>
        )}

        {/* Actions only for scheduled sessions */}
        {isScheduled && (
          <>
            {/* Complete action */}
            <Button className="w-full" size="lg" variant="secondary" onClick={() => setCompleteOpen(true)}>
              <CheckCircle className="mr-2 h-4 w-4" strokeWidth={1.5} />
              Označit dokončený
            </Button>

            {/* Secondary actions */}
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setRescheduleOpen(true)}
              >
                <CalendarClock className="mr-1.5 h-4 w-4" strokeWidth={1.5} />
                Přesunout
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setCancelOpen(true)}
              >
                <XCircle className="mr-1.5 h-4 w-4" strokeWidth={1.5} />
                Zrušit
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setNoShowOpen(true)}
              >
                <UserX className="mr-1.5 h-4 w-4" strokeWidth={1.5} />
                Nedostavil se
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="mr-1.5 h-4 w-4" strokeWidth={1.5} />
                Smazat
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Complete dialog */}
      <ConfirmDialog
        isOpen={completeOpen}
        onClose={() => setCompleteOpen(false)}
        onConfirm={handleComplete}
        title="Dokončit trénink"
        description="Označit trénink jako dokončený? Tato akce odečte trénink z balíčku klienta."
        confirmLabel="Dokončit"
        loading={loading}
      />

      {/* Cancel dialog */}
      <ConfirmDialog
        isOpen={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={handleCancel}
        title="Zrušit trénink"
        description="Opravdu chcete zrušit tento trénink? Trénink nebude odečten z balíčku."
        confirmLabel="Zrušit trénink"
        variant="danger"
        loading={loading}
      />

      {/* No show dialog */}
      <ConfirmDialog
        isOpen={noShowOpen}
        onClose={() => setNoShowOpen(false)}
        onConfirm={handleNoShow}
        title="Klient se nedostavil"
        description="Označit trénink jako nedostavení? Trénink nebude odečten z balíčku."
        confirmLabel="Potvrdit"
        variant="danger"
        loading={loading}
      />

      {/* Reschedule sheet */}
      <BottomSheet isOpen={rescheduleOpen} onClose={() => setRescheduleOpen(false)} title="Přesunout trénink">
        <div className="space-y-4">
          <Input
            label="Nový datum a čas"
            type="datetime-local"
            value={newDateTime}
            onChange={(e) => setNewDateTime(e.target.value)}
          />
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setRescheduleOpen(false)} className="flex-1" disabled={loading}>
              Zrušit
            </Button>
            <Button onClick={handleReschedule} loading={loading} className="flex-1">
              Přesunout
            </Button>
          </div>
        </div>
      </BottomSheet>

      {/* Delete dialog */}
      {recurrenceGroupId ? (
        <BottomSheet isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} title="Smazat trénink">
          <p className="mb-4 text-sm text-text-secondary">Tento trénink je součástí opakující se série.</p>
          <div className="space-y-2">
            <Button variant="danger" className="w-full" onClick={handleDelete} loading={loading}>
              Smazat pouze tento trénink
            </Button>
            <Button variant="danger" className="w-full" onClick={handleDeleteAllFuture} loading={loading}>
              Smazat tento a všechny budoucí
            </Button>
            <Button variant="secondary" className="w-full" onClick={() => setDeleteOpen(false)} disabled={loading}>
              Zpět
            </Button>
          </div>
        </BottomSheet>
      ) : (
        <ConfirmDialog
          isOpen={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onConfirm={handleDelete}
          title="Smazat trénink"
          description="Opravdu chcete smazat tento trénink? Tato akce je nevratná."
          confirmLabel="Smazat"
          variant="danger"
          loading={loading}
        />
      )}
    </>
  )
}
