'use client'

import { useMemo } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { InBodyRecord, InBodyExtendedData } from '@/types'

interface InBodyDeltaProps {
  latest: InBodyRecord
  previous: InBodyRecord
}

type DeltaMetric = {
  key: string
  label: string
  unit: string
  /** true = increase is good (green); false = decrease is good (green) */
  increaseIsGood: boolean
  getValue: (record: InBodyRecord) => number | null | undefined
}

const DELTA_METRICS: DeltaMetric[] = [
  {
    key: 'weight',
    label: 'Váha',
    unit: 'kg',
    increaseIsGood: false,
    getValue: (r) => r.weight,
  },
  {
    key: 'body_fat_pct',
    label: 'Tělesný tuk',
    unit: '%',
    increaseIsGood: false,
    getValue: (r) => r.body_fat_pct,
  },
  {
    key: 'muscle_mass',
    label: 'Svalová hmota',
    unit: 'kg',
    increaseIsGood: true,
    getValue: (r) => r.muscle_mass,
  },
  {
    key: 'fat_kg',
    label: 'Tuk (kg)',
    unit: 'kg',
    increaseIsGood: false,
    getValue: (r) => (r.custom_data as InBodyExtendedData)?.fat_kg ?? null,
  },
  {
    key: 'ffm_kg',
    label: 'FFM',
    unit: 'kg',
    increaseIsGood: true,
    getValue: (r) => (r.custom_data as InBodyExtendedData)?.ffm_kg ?? null,
  },
  {
    key: 'fitness_score',
    label: 'Fitness skóre',
    unit: '',
    increaseIsGood: true,
    getValue: (r) => (r.custom_data as InBodyExtendedData)?.fitness_score ?? null,
  },
]

type ComputedDelta = {
  key: string
  label: string
  unit: string
  currentValue: number
  delta: number
  isGood: boolean
}

export function InBodyDelta({ latest, previous }: InBodyDeltaProps) {
  const deltas = useMemo(() => {
    const result: ComputedDelta[] = []
    for (const m of DELTA_METRICS) {
      const latestVal = m.getValue(latest)
      const prevVal = m.getValue(previous)
      if (latestVal == null || prevVal == null) continue
      const delta = latestVal - prevVal
      if (delta === 0) continue
      const isGood = m.increaseIsGood ? delta > 0 : delta < 0
      result.push({
        key: m.key,
        label: m.label,
        unit: m.unit,
        currentValue: latestVal,
        delta,
        isGood,
      })
    }
    return result
  }, [latest, previous])

  if (deltas.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-medium text-text-primary">Změna oproti minulému měření</h3>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="space-y-2">
          {deltas.map((d) => {
            const sign = d.delta > 0 ? '+' : ''
            const formatted = `${sign}${d.delta.toFixed(1)}${d.unit ? ` ${d.unit}` : ''}`
            const Icon = d.delta > 0 ? TrendingUp : TrendingDown
            const colorClass = d.isGood ? 'text-success' : 'text-danger'

            return (
              <div key={d.key} className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">{d.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-text-primary">
                    {d.currentValue.toFixed(1)}{d.unit ? ` ${d.unit}` : ''}
                  </span>
                  <span className={`flex items-center gap-1 ${colorClass}`}>
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                    {formatted}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
