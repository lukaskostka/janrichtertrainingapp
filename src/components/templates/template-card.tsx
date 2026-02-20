'use client'

import { useState } from 'react'
import { Trash2, LayoutList, Pencil } from 'lucide-react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { deleteTemplateAction } from '@/lib/actions/templates'
import type { WorkoutTemplate, TemplateExercise } from '@/types'

interface TemplateCardProps {
  template: WorkoutTemplate
}

export function TemplateCard({ template }: TemplateCardProps) {
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const exercises = (template.exercises as TemplateExercise[]) || []

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteTemplateAction(template.id)
    } catch {
      // Error handled by revalidation
    } finally {
      setDeleting(false)
      setShowDelete(false)
    }
  }

  return (
    <>
      <Card className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <LayoutList className="h-5 w-5 flex-shrink-0 text-text-secondary" strokeWidth={1.5} />
              <p className="font-medium text-text-primary truncate">{template.name}</p>
            </div>
            <div className="mt-2 flex items-center gap-2">
              {template.category && (
                <Badge>{template.category}</Badge>
              )}
              <span className="text-sm text-text-secondary">
                {exercises.length} {exercises.length === 1 ? 'cvik' : exercises.length < 5 ? 'cviky' : 'cviků'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href={`/templates/${template.id}/edit`}
              className="rounded-lg p-2 text-text-secondary transition-colors hover:text-text-primary"
            >
              <Pencil className="h-4 w-4" strokeWidth={1.5} />
            </Link>
            <button
              onClick={() => setShowDelete(true)}
              className="rounded-lg p-2 text-text-secondary transition-colors hover:text-danger"
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </Card>

      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Smazat šablonu"
        description={`Opravdu chcete smazat šablonu "${template.name}"?`}
        confirmLabel="Smazat"
        variant="danger"
        loading={deleting}
      />
    </>
  )
}
