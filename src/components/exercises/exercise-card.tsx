'use client'

import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { deleteExerciseAction } from '@/lib/actions/exercises'
import type { Exercise } from '@/types'

interface ExerciseCardProps {
  exercise: Exercise
  onEdit: (exercise: Exercise) => void
}

export function ExerciseCard({ exercise, onEdit }: ExerciseCardProps) {
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteExerciseAction(exercise.id)
    } catch {
      // Error handled by revalidation
    } finally {
      setDeleting(false)
      setShowDelete(false)
    }
  }

  return (
    <>
      <Card className="flex items-center justify-between p-4">
        <p className="font-medium text-text-primary">{exercise.name}</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(exercise)}
            className="rounded-lg p-2 text-text-secondary transition-colors hover:text-text-primary"
          >
            <Pencil className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <button
            onClick={() => setShowDelete(true)}
            className="rounded-lg p-2 text-text-secondary transition-colors hover:text-danger"
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
      </Card>

      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Smazat cvik"
        description={`Opravdu chcete smazat cvik "${exercise.name}"?`}
        confirmLabel="Smazat"
        variant="danger"
        loading={deleting}
      />
    </>
  )
}
