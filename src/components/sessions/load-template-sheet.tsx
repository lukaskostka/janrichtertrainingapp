'use client'

import { useState, useEffect } from 'react'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { SearchInput } from '@/components/ui/search-input'
import { EmptyState } from '@/components/ui/empty-state'
import { Loading } from '@/components/ui/loading'
import { FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { WorkoutTemplate, TemplateExercise } from '@/types'

interface LoadTemplateSheetProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (template: WorkoutTemplate) => void
}

export function LoadTemplateSheet({ isOpen, onClose, onSelect }: LoadTemplateSheetProps) {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const [prevOpen, setPrevOpen] = useState(false)
  if (isOpen && !prevOpen) {
    setPrevOpen(true)
    setLoading(true)
  } else if (!isOpen && prevOpen) {
    setPrevOpen(false)
  }

  useEffect(() => {
    if (!isOpen) return
    const supabase = createClient()
    let cancelled = false
    supabase
      .from('workout_templates')
      .select('*')
      .order('name')
      .then(({ data }) => {
        if (cancelled) return
        setTemplates((data as WorkoutTemplate[]) || [])
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [isOpen])

  const filtered = templates.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Načíst šablonu">
      <SearchInput
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Hledat šablonu..."
        containerClassName="mb-4"
      />

      {loading ? (
        <Loading className="py-8" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Žádné šablony"
          description={search ? 'Žádné šablony neodpovídají hledání' : 'Zatím nemáte žádné tréninkové šablony'}
        />
      ) : (
        <div className="max-h-[50vh] space-y-1 overflow-y-auto">
          {filtered.map((template) => {
            const exercises = (template.exercises || []) as TemplateExercise[]
            return (
              <button
                key={template.id}
                onClick={() => {
                  onSelect(template)
                  onClose()
                }}
                className="w-full rounded-lg px-3 py-3 text-left transition-colors hover:bg-elevated"
              >
                <p className="text-sm font-medium text-text-primary">{template.name}</p>
                {template.category && (
                  <p className="text-xs text-text-tertiary">{template.category}</p>
                )}
                <p className="mt-0.5 text-xs text-text-tertiary">
                  {exercises.length} {exercises.length === 1 ? 'cvik' : exercises.length < 5 ? 'cviky' : 'cviků'}
                </p>
              </button>
            )
          })}
        </div>
      )}
    </BottomSheet>
  )
}
