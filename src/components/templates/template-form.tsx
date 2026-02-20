'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, ChevronUp, ChevronDown, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { SearchInput } from '@/components/ui/search-input'
import { createTemplateAction, updateTemplateAction } from '@/lib/actions/templates'
import { getExercises } from '@/lib/actions/exercises'
import type { Exercise, TemplateExercise, ExerciseSet, WorkoutTemplate } from '@/types'

const defaultSet: ExerciseSet = { reps: 10, weight: 0 }

interface TemplateFormProps {
  template?: WorkoutTemplate
  onSuccess?: () => void
}

export function TemplateForm({ template, onSuccess }: TemplateFormProps) {
  const router = useRouter()
  const [name, setName] = useState(template?.name ?? '')
  const [category, setCategory] = useState(template?.category ?? '')
  const [templateExercises, setTemplateExercises] = useState<TemplateExercise[]>(
    template ? (template.exercises as TemplateExercise[]) || [] : []
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Exercise picker state
  const [showPicker, setShowPicker] = useState(false)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (showPicker) {
      getExercises(search || undefined).then(setExercises).catch(() => {})
    }
  }, [showPicker, search])

  function addExercise(exercise: Exercise) {
    setTemplateExercises((prev) => [
      ...prev,
      {
        exercise_id: exercise.id,
        exercise_name: exercise.name,
        sets_config: [{ ...defaultSet }],
        order_index: prev.length,
        superset_group: null,
      },
    ])
    setShowPicker(false)
    setSearch('')
  }

  function removeExercise(index: number) {
    setTemplateExercises((prev) =>
      prev.filter((_, i) => i !== index).map((ex, i) => ({ ...ex, order_index: i }))
    )
  }

  function moveExercise(index: number, direction: 'up' | 'down') {
    setTemplateExercises((prev) => {
      const arr = [...prev]
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= arr.length) return prev
      ;[arr[index], arr[targetIndex]] = [arr[targetIndex], arr[index]]
      return arr.map((ex, i) => ({ ...ex, order_index: i }))
    })
  }

  function updateSet(exerciseIndex: number, setIndex: number, field: keyof ExerciseSet, value: number) {
    setTemplateExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exerciseIndex) return ex
        const sets = [...ex.sets_config]
        sets[setIndex] = { ...sets[setIndex], [field]: value }
        return { ...ex, sets_config: sets }
      })
    )
  }

  function addSet(exerciseIndex: number) {
    setTemplateExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exerciseIndex) return ex
        const lastSet = ex.sets_config[ex.sets_config.length - 1] || defaultSet
        return { ...ex, sets_config: [...ex.sets_config, { ...lastSet }] }
      })
    )
  }

  function removeSet(exerciseIndex: number, setIndex: number) {
    setTemplateExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exerciseIndex) return ex
        if (ex.sets_config.length <= 1) return ex
        return { ...ex, sets_config: ex.sets_config.filter((_, si) => si !== setIndex) }
      })
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Název šablony je povinný')
      return
    }
    if (templateExercises.length === 0) {
      setError('Přidejte alespoň jeden cvik')
      return
    }

    setLoading(true)
    setError('')
    try {
      if (template) {
        await updateTemplateAction(template.id, name.trim(), category.trim() || null, templateExercises)
      } else {
        await createTemplateAction(name.trim(), category.trim() || null, templateExercises)
      }
      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/templates')
      }
    } catch {
      setError(template ? 'Nepodařilo se uložit šablonu' : 'Nepodařilo se vytvořit šablonu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 px-4 py-4">
        <Input
          id="name"
          label="Název šablony *"
          placeholder="např. Upper body"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          id="category"
          label="Kategorie"
          placeholder="např. Síla, Hypertrofie"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium text-text-secondary">Cviky</h3>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowPicker(true)}
              className="gap-1"
            >
              <Plus className="h-4 w-4" strokeWidth={1.5} />
              Přidat cvik
            </Button>
          </div>

          {templateExercises.length === 0 && (
            <p className="py-6 text-center text-sm text-text-tertiary">
              Zatím žádné cviky. Klikněte na &quot;Přidat cvik&quot;.
            </p>
          )}

          <div className="space-y-3">
            {templateExercises.map((ex, exIdx) => (
              <Card key={`${ex.exercise_id}-${exIdx}`} className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-medium text-text-primary">{ex.exercise_name}</p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveExercise(exIdx, 'up')}
                      disabled={exIdx === 0}
                      className="rounded p-1 text-text-secondary transition-colors hover:text-text-primary disabled:opacity-30"
                    >
                      <ChevronUp className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveExercise(exIdx, 'down')}
                      disabled={exIdx === templateExercises.length - 1}
                      className="rounded p-1 text-text-secondary transition-colors hover:text-text-primary disabled:opacity-30"
                    >
                      <ChevronDown className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeExercise(exIdx)}
                      className="rounded p-1 text-text-secondary transition-colors hover:text-danger"
                    >
                      <X className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-[auto_1fr_1fr_auto] items-center gap-2 text-xs text-text-tertiary">
                    <span className="w-6">#</span>
                    <span>Opak.</span>
                    <span>Váha (kg)</span>
                    <span className="w-6" />
                  </div>
                  {ex.sets_config.map((set, setIdx) => (
                    <div
                      key={setIdx}
                      className="grid grid-cols-[auto_1fr_1fr_auto] items-center gap-2"
                    >
                      <span className="w-6 text-center text-xs text-text-tertiary">{setIdx + 1}</span>
                      <input
                        type="number"
                        min={0}
                        value={set.reps}
                        onChange={(e) => updateSet(exIdx, setIdx, 'reps', Number(e.target.value))}
                        className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                      />
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        value={set.weight}
                        onChange={(e) => updateSet(exIdx, setIdx, 'weight', Number(e.target.value))}
                        className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                      />
                      <button
                        type="button"
                        onClick={() => removeSet(exIdx, setIdx)}
                        disabled={ex.sets_config.length <= 1}
                        className="w-6 text-center text-text-secondary hover:text-danger disabled:opacity-30"
                      >
                        <X className="h-3 w-3 mx-auto" strokeWidth={1.5} />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => addSet(exIdx)}
                  className="mt-2 text-xs text-text-secondary hover:text-text-primary"
                >
                  + Přidat sérii
                </button>
              </Card>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button type="submit" loading={loading} className="w-full">
          {template ? 'Uložit šablonu' : 'Vytvořit šablonu'}
        </Button>
      </form>

      <BottomSheet
        isOpen={showPicker}
        onClose={() => {
          setShowPicker(false)
          setSearch('')
        }}
        title="Vyberte cvik"
      >
        <SearchInput
          placeholder="Hledat cvik..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          containerClassName="mb-4"
        />
        <div className="space-y-2">
          {exercises.length === 0 && (
            <p className="py-4 text-center text-sm text-text-tertiary">
              Žádné cviky nenalezeny
            </p>
          )}
          {exercises.map((exercise) => (
            <button
              key={exercise.id}
              type="button"
              onClick={() => addExercise(exercise)}
              className="w-full rounded-xl border border-border bg-elevated p-3 text-left text-text-primary transition-colors hover:bg-card"
            >
              {exercise.name}
            </button>
          ))}
        </div>
      </BottomSheet>
    </>
  )
}
