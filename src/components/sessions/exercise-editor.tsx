'use client'

import { useState, useCallback, useMemo } from 'react'
import { Plus, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { EmptyState } from '@/components/ui/empty-state'
import { ExerciseBlock } from '@/components/sessions/exercise-block'
import { AddExerciseSheet } from '@/components/sessions/add-exercise-sheet'
import { LoadTemplateSheet } from '@/components/sessions/load-template-sheet'
import { getSupersetLabels, groupExercisesForRender } from '@/lib/utils'
import {
  addSessionExercise,
  getLastExerciseSets,
  updateSessionExerciseSets,
  updateSessionExerciseSuperset,
} from '@/lib/actions/session-exercises'
import type { Exercise, ExerciseSet, WorkoutTemplate, TemplateExercise } from '@/types'

interface ExerciseRecord {
  id: string
  exercise_id: string
  order_index: number
  sets: ExerciseSet[]
  notes: string | null
  superset_group: number | null
  exercises: { id: string; name: string }
}

interface ExerciseEditorProps {
  sessionId: string
  clientId: string
  initialExercises: ExerciseRecord[]
}

export function ExerciseEditor({ sessionId, clientId, initialExercises }: ExerciseEditorProps) {
  const [exercises, setExercises] = useState<ExerciseRecord[]>(initialExercises)
  const [addExerciseOpen, setAddExerciseOpen] = useState(false)
  const [templateOpen, setTemplateOpen] = useState(false)
  const { toast } = useToast()

  const handleAddExercise = useCallback(async (exercise: Exercise) => {
    const orderIndex = exercises.length
    try {
      const record = await addSessionExercise(sessionId, exercise.id, orderIndex)

      let prefillSets: ExerciseSet[] = []
      if (clientId) {
        try {
          prefillSets = await getLastExerciseSets(clientId, exercise.id) as ExerciseSet[]
        } catch (err) {
          console.error('Failed to get last exercise sets:', err)
        }
      }

      const newExercise: ExerciseRecord = {
        id: record.id,
        exercise_id: record.exercise_id,
        order_index: record.order_index,
        sets: prefillSets.length > 0 ? prefillSets : [],
        notes: record.notes,
        superset_group: null,
        exercises: { id: exercise.id, name: exercise.name },
      }

      if (prefillSets.length > 0) {
        await updateSessionExerciseSets(record.id, prefillSets)
      }

      setExercises((prev) => [...prev, newExercise])
    } catch (err) {
      console.error('Failed to add exercise:', err)
    }
  }, [exercises.length, sessionId, clientId])

  const handleLoadTemplate = useCallback(async (template: WorkoutTemplate) => {
    const templateExercises = (template.exercises || []) as TemplateExercise[]
    if (templateExercises.length === 0) return

    const startIndex = exercises.length

    for (let i = 0; i < templateExercises.length; i++) {
      const te = templateExercises[i]
      try {
        const record = await addSessionExercise(sessionId, te.exercise_id, startIndex + i)

        let sets: ExerciseSet[] = te.sets_config || []
        if (clientId) {
          try {
            const lastSets = await getLastExerciseSets(clientId, te.exercise_id) as ExerciseSet[]
            if (lastSets && lastSets.length > 0) {
              sets = lastSets
            }
          } catch (err) {
            console.error('Failed to get last exercise sets:', err)
          }
        }

        if (sets.length > 0) {
          await updateSessionExerciseSets(record.id, sets)
        }

        if (te.superset_group !== null && te.superset_group !== undefined) {
          await updateSessionExerciseSuperset(record.id, te.superset_group)
        }

        const newExercise: ExerciseRecord = {
          id: record.id,
          exercise_id: record.exercise_id,
          order_index: record.order_index,
          sets,
          notes: record.notes,
          superset_group: te.superset_group ?? null,
          exercises: { id: te.exercise_id, name: te.exercise_name || record.exercises?.name || 'Cvik' },
        }

        setExercises((prev) => [...prev, newExercise])
      } catch (err) {
        console.error('Failed to load template exercise:', err)
      }
    }
  }, [exercises.length, sessionId, clientId])

  const handleRemoveExercise = useCallback((id: string) => {
    const removedExercise = exercises.find((e) => e.id === id)
    if (!removedExercise) return

    setExercises((prev) => prev.filter((e) => e.id !== id))

    toast('Cvik odebrán', 'warning', {
      action: 'Vrátit',
      duration: 5000,
      onAction: async () => {
        try {
          const record = await addSessionExercise(sessionId, removedExercise.exercise_id, exercises.length)
          const restored: ExerciseRecord = {
            ...removedExercise,
            id: record.id,
            order_index: record.order_index,
          }
          if (removedExercise.sets.length > 0) {
            await updateSessionExerciseSets(record.id, removedExercise.sets)
          }
          if (removedExercise.superset_group !== null) {
            await updateSessionExerciseSuperset(record.id, removedExercise.superset_group)
          }
          setExercises((prev) => [...prev, restored])
        } catch (err) {
          console.error('Nepodařilo se obnovit cvik:', err)
        }
      }
    })
  }, [exercises, toast, sessionId])

  const handleSetsChange = useCallback((id: string, sets: ExerciseSet[]) => {
    setExercises((prev) =>
      prev.map((e) => (e.id === id ? { ...e, sets } : e))
    )
  }, [])

  const handleSupersetToggle = useCallback(async (id: string, currentGroup: number | null) => {
    if (currentGroup !== null) {
      setExercises((prev) =>
        prev.map((e) => (e.id === id ? { ...e, superset_group: null } : e))
      )
      try {
        await updateSessionExerciseSuperset(id, null)
      } catch (err) { console.error('Failed to update superset:', err) }
    } else {
      const idx = exercises.findIndex((e) => e.id === id)
      let groupToAssign: number

      if (idx > 0 && exercises[idx - 1].superset_group !== null) {
        groupToAssign = exercises[idx - 1].superset_group!
      } else {
        const maxGroup = exercises.reduce((max, e) => Math.max(max, e.superset_group ?? 0), 0)
        groupToAssign = maxGroup + 1
      }

      setExercises((prev) =>
        prev.map((e) => (e.id === id ? { ...e, superset_group: groupToAssign } : e))
      )
      try {
        await updateSessionExerciseSuperset(id, groupToAssign)
      } catch (err) { console.error('Failed to update superset:', err) }
    }
  }, [exercises])

  const supersetLabels = useMemo(() => getSupersetLabels(exercises), [exercises])

  const renderGroups = useMemo(() => groupExercisesForRender(exercises), [exercises])

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold text-text-primary">Cviky</h2>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setTemplateOpen(true)}
          >
            <FileText className="mr-1 h-3.5 w-3.5" strokeWidth={1.5} />
            Šablona
          </Button>
          <Button
            size="sm"
            onClick={() => setAddExerciseOpen(true)}
          >
            <Plus className="mr-1 h-3.5 w-3.5" strokeWidth={1.5} />
            Cvik
          </Button>
        </div>
      </div>

      {exercises.length === 0 ? (
        <EmptyState
          title="Zatím žádné cviky"
          description="Přidejte cvik nebo načtěte šablonu"
          className="py-8"
        />
      ) : (
        <div className="space-y-3">
          {renderGroups.map((group) => {
            if (group.type === 'superset' && group.exercises.length > 1) {
              return (
                <div
                  key={`group-${group.group}`}
                  className="rounded-2xl border border-warning/30 bg-warning/5 p-2"
                >
                  <p className="mb-2 px-2 text-xs font-medium text-warning">
                    Superset
                  </p>
                  <div className="space-y-2">
                    {group.exercises.map((ex) => (
                      <ExerciseBlock
                        key={ex.id}
                        exerciseRecord={ex}
                        supersetLabel={supersetLabels.get(ex.id)}
                        onRemove={handleRemoveExercise}
                        onSetsChange={handleSetsChange}
                        onSupersetToggle={handleSupersetToggle}
                      />
                    ))}
                  </div>
                </div>
              )
            }
            return group.exercises.map((ex) => (
              <ExerciseBlock
                key={ex.id}
                exerciseRecord={ex}
                supersetLabel={supersetLabels.get(ex.id)}
                onRemove={handleRemoveExercise}
                onSetsChange={handleSetsChange}
                onSupersetToggle={handleSupersetToggle}
              />
            ))
          })}
        </div>
      )}

      <AddExerciseSheet
        isOpen={addExerciseOpen}
        onClose={() => setAddExerciseOpen(false)}
        onSelect={handleAddExercise}
      />
      <LoadTemplateSheet
        isOpen={templateOpen}
        onClose={() => setTemplateOpen(false)}
        onSelect={handleLoadTemplate}
      />
    </div>
  )
}
