'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createExerciseAction, updateExerciseAction } from '@/lib/actions/exercises'
import { hapticSuccess } from '@/lib/haptics'
import type { Exercise } from '@/types'

interface ExerciseFormProps {
  exercise?: Exercise | null
  onSuccess: () => void
  onDirtyChange?: (dirty: boolean) => void
}

export function ExerciseForm({ exercise, onSuccess, onDirtyChange }: ExerciseFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    setIsDirty(false)
    onDirtyChange?.(false)
  }, [exercise, onDirtyChange])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const name = (formData.get('name') as string).trim()

    if (!name) {
      setError('Název cviku je povinný')
      setLoading(false)
      return
    }

    try {
      if (exercise) {
        await updateExerciseAction(exercise.id, formData)
      } else {
        await createExerciseAction(formData)
      }
      hapticSuccess()
      setIsDirty(false)
      onDirtyChange?.(false)
      onSuccess()
    } catch {
      setError('Nepodařilo se uložit cvik')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      onChange={() => {
        if (!isDirty) {
          setIsDirty(true)
          onDirtyChange?.(true)
        }
      }}
      className="space-y-4"
    >
      <Input
        id="name"
        name="name"
        label="Název cviku"
        placeholder="např. Bench press"
        defaultValue={exercise?.name || ''}
        error={error}
        autoFocus
      />
      <Button type="submit" loading={loading} className="w-full">
        {exercise ? 'Uložit' : 'Přidat cvik'}
      </Button>
    </form>
  )
}
