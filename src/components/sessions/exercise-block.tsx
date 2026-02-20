'use client'

import React, { useState, useCallback } from 'react'
import { Plus, Trash2, MessageSquare, Link2, Link2Off } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { hapticFeedback } from '@/lib/haptics'
import { SetRow } from './set-row'
import { updateSessionExerciseSets, updateSessionExerciseNotes, removeSessionExercise } from '@/lib/actions/session-exercises'
import type { ExerciseSet } from '@/types'

interface ExerciseBlockProps {
  exerciseRecord: {
    id: string
    exercise_id: string
    sets: ExerciseSet[]
    notes: string | null
    superset_group: number | null
    exercises: { id: string; name: string }
  }
  supersetLabel?: string
  onRemove: (id: string) => void
  onSetsChange: (id: string, sets: ExerciseSet[]) => void
  onSupersetToggle: (id: string, currentGroup: number | null) => void
}

export const ExerciseBlock = React.memo(function ExerciseBlock({ exerciseRecord, supersetLabel, onRemove, onSetsChange, onSupersetToggle }: ExerciseBlockProps) {
  const [sets, setSets] = useState<ExerciseSet[]>(exerciseRecord.sets || [])
  const [showNotes, setShowNotes] = useState(!!exerciseRecord.notes)
  const [notes, setNotes] = useState(exerciseRecord.notes || '')

  const saveSets = useCallback(async (newSets: ExerciseSet[]) => {
    setSets(newSets)
    onSetsChange(exerciseRecord.id, newSets)
    try {
      await updateSessionExerciseSets(exerciseRecord.id, newSets)
    } catch (err) {
      console.error('Chyba při ukládání:', err)
    }
  }, [exerciseRecord.id, onSetsChange])

  const handleSetChange = useCallback((index: number, newSet: ExerciseSet) => {
    const newSets = [...sets]
    newSets[index] = newSet
    saveSets(newSets)
  }, [sets, saveSets])

  const handleRemoveSet = useCallback((index: number) => {
    const newSets = sets.filter((_, i) => i !== index)
    saveSets(newSets)
  }, [sets, saveSets])

  const handleAddSet = useCallback(() => {
    const lastSet = sets[sets.length - 1]
    const newSet: ExerciseSet = lastSet ? { ...lastSet } : { reps: 12, weight: 0 }
    hapticFeedback('light')
    saveSets([...sets, newSet])
  }, [sets, saveSets])

  const handleSaveNotes = async () => {
    try {
      await updateSessionExerciseNotes(exerciseRecord.id, notes)
    } catch (err) {
      console.error('Chyba při ukládání poznámek:', err)
    }
  }

  const handleRemoveExercise = async () => {
    try {
      await removeSessionExercise(exerciseRecord.id)
      onRemove(exerciseRecord.id)
    } catch (err) {
      console.error('Chyba při odstraňování cviku:', err)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {supersetLabel && (
            <span className="rounded-md bg-warning/20 px-1.5 py-0.5 text-xs font-medium text-warning">
              {supersetLabel}
            </span>
          )}
          <h3 className="text-sm font-semibold text-text-primary">
            {exerciseRecord.exercises?.name}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onSupersetToggle(exerciseRecord.id, exerciseRecord.superset_group)}
            className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg transition-colors ${
              exerciseRecord.superset_group
                ? 'text-warning hover:text-warning/70'
                : 'text-text-tertiary hover:text-text-primary'
            }`}
            title={exerciseRecord.superset_group ? 'Odebrat ze supersetu' : 'Přidat do supersetu'}
            aria-label={exerciseRecord.superset_group ? 'Odebrat ze supersetu' : 'Přidat do supersetu'}
          >
            {exerciseRecord.superset_group ? (
              <Link2Off className="h-4 w-4" strokeWidth={1.5} />
            ) : (
              <Link2 className="h-4 w-4" strokeWidth={1.5} />
            )}
          </button>
          <button
            onClick={handleRemoveExercise}
            aria-label="Odstranit cvik"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-text-tertiary transition-colors hover:text-danger"
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {sets.length > 0 && (
        <div className="mb-2 flex items-center gap-2 px-0">
          <span className="w-8 text-center text-xs text-text-tertiary">#</span>
          <span className="w-20 text-center text-xs text-text-tertiary">Opak.</span>
          <span className="w-4" />
          <span className="w-24 text-center text-xs text-text-tertiary">Váha (kg)</span>
        </div>
      )}

      <div className="space-y-2">
        {sets.map((set, i) => (
          <SetRow
            key={i}
            index={i}
            set={set}
            onChange={(s) => handleSetChange(i, s)}
            onRemove={() => handleRemoveSet(i)}
          />
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleAddSet}
        >
          <Plus className="mr-1 h-3.5 w-3.5" strokeWidth={1.5} />
          Přidat sérii
        </Button>
        <button
          onClick={() => setShowNotes(!showNotes)}
          aria-label="Poznámky ke cviku"
          className="rounded-lg p-1.5 text-text-tertiary transition-colors hover:text-text-primary"
        >
          <MessageSquare className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>

      {showNotes && (
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={handleSaveNotes}
          placeholder="Poznámky ke cviku..."
          className="mt-3 w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-text-primary placeholder-text-tertiary outline-none focus:border-accent"
          rows={2}
        />
      )}
    </div>
  )
})
