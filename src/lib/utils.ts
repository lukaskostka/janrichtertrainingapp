import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'
import { cs } from 'date-fns/locale'
import { toPragueDate } from '@/lib/datetime'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return format(toPragueDate(date), 'd. M. yyyy', { locale: cs })
}

export function formatTime(date: string | Date) {
  return format(toPragueDate(date), 'HH:mm', { locale: cs })
}

export function formatDateTime(date: string | Date) {
  return format(toPragueDate(date), 'd. M. yyyy HH:mm', { locale: cs })
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', minimumFractionDigits: 0 }).format(amount)
}

/**
 * Compute superset labels (A1, A2, B1, ...) for exercises grouped by superset_group.
 */
export function getSupersetLabels(exercises: { id: string; superset_group: number | null }[]): Map<string, string> {
  const labels = new Map<string, string>()
  const groupMap = new Map<number, string[]>()

  for (const ex of exercises) {
    if (ex.superset_group !== null) {
      if (!groupMap.has(ex.superset_group)) {
        groupMap.set(ex.superset_group, [])
      }
      groupMap.get(ex.superset_group)!.push(ex.id)
    }
  }

  const sortedGroups = Array.from(groupMap.keys()).sort((a, b) => a - b)
  sortedGroups.forEach((group, groupIdx) => {
    const letter = String.fromCharCode(65 + groupIdx)
    const ids = groupMap.get(group)!
    ids.forEach((id, idx) => {
      labels.set(id, `${letter}${idx + 1}`)
    })
  })

  return labels
}

/**
 * Group exercises into render groups (single or superset) for display.
 */
export function groupExercisesForRender<T extends { superset_group: number | null }>(
  exercises: T[]
): { type: 'single' | 'superset'; exercises: T[]; group?: number }[] {
  const renderGroups: { type: 'single' | 'superset'; exercises: T[]; group?: number }[] = []
  let currentGroup: number | null = null
  let currentGroupExs: T[] = []

  for (const ex of exercises) {
    if (ex.superset_group !== null) {
      if (currentGroup === ex.superset_group) {
        currentGroupExs.push(ex)
      } else {
        if (currentGroupExs.length > 0) {
          renderGroups.push({ type: 'superset', exercises: currentGroupExs, group: currentGroup! })
        }
        currentGroup = ex.superset_group
        currentGroupExs = [ex]
      }
    } else {
      if (currentGroupExs.length > 0) {
        renderGroups.push({ type: 'superset', exercises: currentGroupExs, group: currentGroup! })
        currentGroup = null
        currentGroupExs = []
      }
      renderGroups.push({ type: 'single', exercises: [ex] })
    }
  }
  if (currentGroupExs.length > 0) {
    renderGroups.push({ type: 'superset', exercises: currentGroupExs, group: currentGroup! })
  }

  return renderGroups
}
