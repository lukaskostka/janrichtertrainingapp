'use client'

import React from 'react'
import { Trash2 } from 'lucide-react'
import type { ExerciseSet } from '@/types'

interface SetRowProps {
  index: number
  set: ExerciseSet
  onChange: (set: ExerciseSet) => void
  onRemove: () => void
}

export const SetRow = React.memo(function SetRow({ index, set, onChange, onRemove }: SetRowProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 text-center text-xs text-text-tertiary">{index + 1}.</span>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        value={set.reps ?? ''}
        onChange={(e) => {
          const val = e.target.value === '' ? 0 : parseInt(e.target.value)
          onChange({ ...set, reps: isNaN(val) ? 0 : val })
        }}
        placeholder="Opak."
        className="w-20 rounded-lg border border-border bg-elevated px-3 py-3 text-center text-base font-medium text-text-primary outline-none transition-colors focus:border-accent focus:bg-card"
      />
      <span className="text-xs text-text-tertiary">x</span>
      <input
        type="number"
        inputMode="decimal"
        step="0.5"
        min={0}
        value={set.weight ?? ''}
        onChange={(e) => {
          const val = e.target.value === '' ? 0 : parseFloat(e.target.value)
          onChange({ ...set, weight: isNaN(val) ? 0 : val })
        }}
        placeholder="Váha"
        className="w-24 rounded-lg border border-border bg-elevated px-3 py-3 text-center text-base font-medium text-text-primary outline-none transition-colors focus:border-accent focus:bg-card"
      />
      <span className="text-xs text-text-tertiary">kg</span>
      <button
        onClick={onRemove}
        aria-label="Odstranit sérii"
        className="ml-auto flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-text-tertiary transition-colors hover:text-danger"
      >
        <Trash2 className="h-4 w-4" strokeWidth={1.5} />
      </button>
    </div>
  )
})
