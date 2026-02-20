'use client'

import { useState } from 'react'
import { Repeat, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { deleteFutureRecurringSessions } from '@/lib/actions/sessions'
import { useToast } from '@/components/ui/toast'
import { hapticSuccess } from '@/lib/haptics'
import type { Session } from '@/types'

interface RecurringActionsProps {
  session: Session
  onDeleted?: () => void
}

export function RecurringActions({ session, onDeleted }: RecurringActionsProps) {
  const { toast } = useToast()
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!session.recurrence_group_id) return null

  async function handleDeleteFuture() {
    if (!session.recurrence_group_id) return
    setLoading(true)
    try {
      await deleteFutureRecurringSessions(
        session.recurrence_group_id,
        session.scheduled_at
      )
      hapticSuccess()
      setShowConfirm(false)
      onDeleted?.()
    } catch {
      toast('Nepodařilo se smazat tréninky')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Badge className="bg-accent/15 text-accent">
          <Repeat className="mr-1 h-3 w-3" strokeWidth={1.5} />
          Opakující se
        </Badge>
      </div>

      <Button
        variant="danger"
        size="sm"
        onClick={() => setShowConfirm(true)}
        className="mt-3 w-full"
      >
        <Trash2 className="mr-1.5 h-4 w-4" strokeWidth={1.5} />
        Smazat všechny budoucí
      </Button>

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDeleteFuture}
        title="Smazat budoucí tréninky"
        description="Opravdu chcete smazat všechny budoucí opakované tréninky od tohoto data? Tato akce je nevratná."
        confirmLabel="Smazat"
        cancelLabel="Zrušit"
        variant="danger"
        loading={loading}
      />
    </>
  )
}
