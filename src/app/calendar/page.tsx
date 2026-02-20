'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Repeat } from 'lucide-react'
import Link from 'next/link'
import { AppShell } from '@/components/layout/app-shell'
import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { Loading } from '@/components/ui/loading'
import { Button } from '@/components/ui/button'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { CalendarWeekView } from '@/components/sessions/calendar-week-view'
import { CalendarDayView } from '@/components/sessions/calendar-day-view'
import { RecurringSessionForm } from '@/components/sessions/recurring-session-form'
import { NewSessionSheet } from '@/components/sessions/new-session-sheet'
import { getSessions } from '@/lib/actions/sessions'
import { getClients } from '@/lib/actions/clients'
import { startOfWeekUtc, endOfWeekUtc } from '@/lib/datetime'
import type { SessionWithClient, Client } from '@/types'

type ViewMode = 'week' | 'day'

export default function CalendarPage() {
  const [view, setView] = useState<ViewMode>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [sessions, setSessions] = useState<SessionWithClient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showRecurring, setShowRecurring] = useState(false)
  const [showNewSession, setShowNewSession] = useState(false)
  const [newSessionDate, setNewSessionDate] = useState<Date | null>(null)
  const [clients, setClients] = useState<Pick<Client, 'id' | 'name'>[]>([])
  const [recurringDirty, setRecurringDirty] = useState(false)
  const [confirmCloseRecurring, setConfirmCloseRecurring] = useState(false)

  useEffect(() => {
    getClients(undefined, 'active').then(setClients).catch(() => {})
  }, [])

  const fetchSessions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const from = startOfWeekUtc(currentDate)
      const to = endOfWeekUtc(currentDate)
      const data = await getSessions({ from, to })
      setSessions((data || []) as SessionWithClient[])
    } catch {
      setSessions([])
      setError('Nepodařilo se načíst kalendář.')
    } finally {
      setLoading(false)
    }
  }, [currentDate])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  return (
    <AppShell>
      <PageHeader
        title="Kalendář"
        rightAction={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => setShowRecurring(true)}>
              <Repeat className="mr-1 h-4 w-4" strokeWidth={1.5} />
              Opakovaný
            </Button>
            <Link href="/sessions/new">
              <Button size="sm">
                <Plus className="mr-1 h-4 w-4" strokeWidth={1.5} />
                Nový
              </Button>
            </Link>
          </div>
        }
      />

      <PageTransition>
      {error && (
        <div className="px-4 pb-4">
          <div className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
            {error}
            <div className="mt-3">
              <Button size="sm" variant="secondary" onClick={fetchSessions}>
                Zkusit znovu
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* View toggle */}
      <div className="flex gap-1 px-4 pb-4">
        <button
          onClick={() => setView('week')}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            view === 'week' ? 'bg-accent text-black' : 'bg-elevated text-text-secondary'
          }`}
        >
          Týden
        </button>
        <button
          onClick={() => setView('day')}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            view === 'day' ? 'bg-accent text-black' : 'bg-elevated text-text-secondary'
          }`}
        >
          Den
        </button>
      </div>

      {loading ? (
        <Loading className="py-12" />
      ) : view === 'week' ? (
        <CalendarWeekView
          sessions={sessions}
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          onDayClick={(date) => {
            setNewSessionDate(date)
            setShowNewSession(true)
          }}
        />
      ) : (
        <CalendarDayView
          sessions={sessions}
          currentDate={currentDate}
          onDateChange={setCurrentDate}
        />
      )}
      </PageTransition>

      <BottomSheet
        isOpen={showRecurring}
        onClose={() => setShowRecurring(false)}
        onCloseRequest={() => {
          if (recurringDirty) {
            setConfirmCloseRecurring(true)
            return
          }
          setShowRecurring(false)
        }}
        title="Opakovaný trénink"
      >
        <RecurringSessionForm
          clients={clients}
          onDirtyChange={setRecurringDirty}
          onSuccess={() => {
            setShowRecurring(false)
            setRecurringDirty(false)
            fetchSessions()
          }}
        />
      </BottomSheet>

      <NewSessionSheet
        isOpen={showNewSession}
        onClose={() => setShowNewSession(false)}
        prefilledDate={newSessionDate}
        onCreated={fetchSessions}
      />
      <ConfirmDialog
        isOpen={confirmCloseRecurring}
        onClose={() => setConfirmCloseRecurring(false)}
        onConfirm={() => {
          setConfirmCloseRecurring(false)
          setRecurringDirty(false)
          setShowRecurring(false)
        }}
        title="Zahodit změny?"
        description="Máte rozpracovaný opakovaný trénink. Opravdu ho chcete zavřít?"
        confirmLabel="Zahodit"
        variant="danger"
      />
    </AppShell>
  )
}
