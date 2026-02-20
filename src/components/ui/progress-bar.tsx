'use client'

import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number
  label?: string
  className?: string
}

export function ProgressBar({ value, label, className }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="text-text-secondary">{label}</span>
          <span className="text-text-tertiary">{Math.round(clamped)}%</span>
        </div>
      )}
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-border"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || 'Průběh'}
      >
        <div
          className="h-full rounded-full bg-accent transition-all duration-500 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
