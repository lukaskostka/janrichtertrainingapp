'use client'

import { useState, useEffect } from 'react'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { SearchInput } from '@/components/ui/search-input'
import { EmptyState } from '@/components/ui/empty-state'
import { Loading } from '@/components/ui/loading'
import { Dumbbell } from 'lucide-react'
import { hapticFeedback } from '@/lib/haptics'
import { createClient } from '@/lib/supabase/client'
import type { Exercise } from '@/types'

interface AddExerciseSheetProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (exercise: Exercise) => void
}

export function AddExerciseSheet({ isOpen, onClose, onSelect }: AddExerciseSheetProps) {
  const [exercises, setExercises] = useState<Exercise[]>([])
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
      .from('exercises')
      .select('*')
      .order('name')
      .then(({ data }) => {
        if (cancelled) return
        setExercises(data || [])
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [isOpen])

  const filtered = exercises.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Přidat cvik">
      <SearchInput
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Hledat cvik..."
        containerClassName="mb-4"
      />

      {loading ? (
        <Loading className="py-8" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="Žádné cviky"
          description={search ? 'Žádné cviky neodpovídají hledání' : 'Zatím nemáte žádné cviky'}
        />
      ) : (
        <div className="max-h-[50vh] space-y-1 overflow-y-auto">
          {filtered.map((exercise) => (
            <button
              key={exercise.id}
              onClick={() => {
                hapticFeedback('medium')
                onSelect(exercise)
                onClose()
              }}
              className="w-full rounded-lg px-3 py-3 text-left text-sm text-text-primary transition-colors hover:bg-elevated"
            >
              {exercise.name}
            </button>
          ))}
        </div>
      )}
    </BottomSheet>
  )
}
