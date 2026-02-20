'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Info } from 'lucide-react'
import { format } from 'date-fns'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Loading } from '@/components/ui/loading'
import { createSessionDirect } from '@/lib/actions/sessions'
import { getActivePackage } from '@/lib/actions/packages'
import { hapticSuccess } from '@/lib/haptics'
import { createClient } from '@/lib/supabase/client'
import { toUtcIsoFromLocalInput } from '@/lib/datetime'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface NewSessionSheetProps {
  isOpen: boolean
  onClose: () => void
  prefilledDate: Date | null
  onCreated?: () => void
}

export function NewSessionSheet({ isOpen, onClose, prefilledDate, onCreated }: NewSessionSheetProps) {
  const router = useRouter()
  const [clients, setClients] = useState<{ value: string; label: string }[]>([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [clientId, setClientId] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [notes, setNotes] = useState('')
  const [noPackageWarning, setNoPackageWarning] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)
  const [pastDateWarning, setPastDateWarning] = useState(false)
  const [collisionWarning, setCollisionWarning] = useState<string | null>(null)
  const submittingRef = useRef(false)

  useEffect(() => {
    if (!scheduledAt) { setCollisionWarning(null); return }
    const date = new Date(scheduledAt)
    if (isNaN(date.getTime())) return

    const supabase = createClient()
    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)

    supabase
      .from('sessions')
      .select('scheduled_at, clients(name)')
      .gte('scheduled_at', dayStart.toISOString())
      .lte('scheduled_at', dayEnd.toISOString())
      .eq('status', 'scheduled')
      .then(({ data }) => {
        if (!data || data.length === 0) { setCollisionWarning(null); return }
        const selectedTime = date.getTime()
        const conflicts = data.filter((s) => {
          const sTime = new Date(s.scheduled_at).getTime()
          return Math.abs(sTime - selectedTime) < 60 * 60 * 1000
        })
        if (conflicts.length > 0) {
          const names = conflicts.map((c) => (c.clients as { name: string } | null)?.name || 'klient').join(', ')
          setCollisionWarning(`Kolize: v tomto čase již máte naplánovaný trénink (${names})`)
        } else {
          setCollisionWarning(null)
        }
      })
  }, [scheduledAt])

  useEffect(() => {
    if (!isOpen) return
    setLoadingClients(true)
    setClientId('')
    setScheduledAt('')
    setNotes('')
    setNoPackageWarning(false)
    setError(null)
    setIsDirty(false)

    if (prefilledDate) {
      const base = format(prefilledDate, "yyyy-MM-dd'T'09:00")
      setScheduledAt(base)
    }

    const supabase = createClient()
    supabase
      .from('clients')
      .select('id, name')
      .eq('status', 'active')
      .order('name')
      .then(({ data }) => {
        setClients((data || []).map((c) => ({ value: c.id, label: c.name })))
        setLoadingClients(false)
      })
  }, [isOpen, prefilledDate])

  async function handleClientChange(newClientId: string) {
    setClientId(newClientId)
    setIsDirty(true)
    if (!newClientId) {
      setNoPackageWarning(false)
      return
    }
    try {
      const pkg = await getActivePackage(newClientId)
      setNoPackageWarning(!pkg)
    } catch {
      setNoPackageWarning(false)
    }
  }

  async function handleSubmit() {
    if (!clientId || !scheduledAt) return
    if (submittingRef.current) return
    submittingRef.current = true
    setLoading(true)
    setError(null)

    try {
      const scheduledUtc = toUtcIsoFromLocalInput(scheduledAt)
      await createSessionDirect({
        client_id: clientId,
        scheduled_at: scheduledUtc,
        notes: notes || undefined,
      })
      hapticSuccess()
      onClose()
      onCreated?.()
      router.refresh()
    } catch {
      setError('Nepodařilo se vytvořit trénink')
    } finally {
      setLoading(false)
      submittingRef.current = false
    }
  }

  function requestClose() {
    if (isDirty && !loading) {
      setConfirmClose(true)
      return
    }
    onClose()
  }

  return (
    <>
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        onCloseRequest={requestClose}
        title="Nový trénink"
      >
      {loadingClients ? (
        <Loading className="py-8" />
      ) : (
        <div className="space-y-4">
          <Select
            id="new_session_client"
            options={clients}
            placeholder="Vyberte klienta"
            value={clientId}
            onChange={(e) => handleClientChange(e.target.value)}
            label="Klient"
          />

          {noPackageWarning && (
            <div className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2.5">
              <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning" strokeWidth={1.5} />
              <p className="text-xs text-warning">
                Tento klient nemá aktivní balíček. Trénink nebude propojen s žádným balíčkem.
              </p>
            </div>
          )}

          <Input
            id="new_session_datetime"
            label="Datum a čas"
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => {
              const val = e.target.value
              setScheduledAt(val)
              setIsDirty(true)
              if (val) {
                setPastDateWarning(new Date(val) < new Date())
              } else {
                setPastDateWarning(false)
              }
            }}
          />

          {pastDateWarning && (
            <div className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2.5">
              <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning" strokeWidth={1.5} />
              <p className="text-xs text-warning">
                Plánujete trénink v minulosti.
              </p>
            </div>
          )}

          {collisionWarning && (
            <div className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2.5">
              <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning" strokeWidth={1.5} />
              <p className="text-xs text-warning">
                {collisionWarning}
              </p>
            </div>
          )}

          <Textarea
            id="new_session_notes"
            label="Poznámky"
            placeholder="Volitelné poznámky..."
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value)
              setIsDirty(true)
            }}
          />

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={requestClose}
              className="flex-1"
              disabled={loading}
            >
              Zrušit
            </Button>
            <Button
              onClick={handleSubmit}
              loading={loading}
              className="flex-1"
              disabled={!clientId || !scheduledAt}
            >
              Naplánovat
            </Button>
          </div>
        </div>
      )}
    </BottomSheet>
    <ConfirmDialog
      isOpen={confirmClose}
      onClose={() => setConfirmClose(false)}
      onConfirm={() => {
        setConfirmClose(false)
        onClose()
      }}
      title="Zahodit změny?"
      description="Máte rozpracovaný trénink. Opravdu ho chcete zavřít?"
      confirmLabel="Zahodit"
      variant="danger"
    />
    </>
  )
}
