'use client'

import { useState, useMemo } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import type { InBodyRecord, InBodyExtendedData } from '@/types'

interface InBodyChartProps {
  records: InBodyRecord[]
}

type MetricKey = 'weight' | 'body_fat_pct' | 'muscle_mass' | 'bmi' | 'ffm_kg' | 'bmr_kcal' | 'fitness_score'

type MetricDef = { key: MetricKey; label: string; unit: string; color: string; extended?: boolean }

const CORE_METRICS: MetricDef[] = [
  { key: 'weight', label: 'Váha', unit: 'kg', color: '#FFFFFF' },
  { key: 'body_fat_pct', label: 'Tělesný tuk', unit: '%', color: '#F59E0B' },
  { key: 'muscle_mass', label: 'Svalová hmota', unit: 'kg', color: '#22C55E' },
]

const EXTENDED_METRICS: MetricDef[] = [
  { key: 'bmi', label: 'BMI', unit: '', color: '#8B5CF6', extended: true },
  { key: 'ffm_kg', label: 'FFM', unit: 'kg', color: '#06B6D4', extended: true },
  { key: 'bmr_kcal', label: 'BMR', unit: 'kcal', color: '#EC4899', extended: true },
  { key: 'fitness_score', label: 'Skóre', unit: '', color: '#14B8A6', extended: true },
]

const ALL_METRICS: MetricDef[] = [...CORE_METRICS, ...EXTENDED_METRICS]

function getMetricValue(record: InBodyRecord, key: MetricKey): number | null {
  switch (key) {
    case 'weight':
    case 'body_fat_pct':
    case 'muscle_mass':
    case 'bmi':
      return record[key] ?? null
    case 'ffm_kg':
    case 'bmr_kcal':
    case 'fitness_score':
      return (record.custom_data as InBodyExtendedData)?.[key] ?? null
    default:
      return null
  }
}

export function InBodyChart({ records }: InBodyChartProps) {
  const [activeMetric, setActiveMetric] = useState<MetricKey>('weight')

  // Sort chronologically for the chart (oldest first)
  const sorted = useMemo(
    () => [...records].sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime()),
    [records]
  )

  // Determine which extended metrics have data in any record
  const availableExtended = useMemo(
    () => EXTENDED_METRICS.filter((m) => records.some((r) => getMetricValue(r, m.key) != null)),
    [records]
  )

  const metric = ALL_METRICS.find((m) => m.key === activeMetric)!

  const chartData = useMemo(
    () =>
      sorted
        .filter((r) => getMetricValue(r, activeMetric) != null)
        .map((r) => ({ date: formatDate(r.measured_at), value: getMetricValue(r, activeMetric) as number })),
    [sorted, activeMetric]
  )

  if (chartData.length < 2) return null

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          {CORE_METRICS.map((m) => (
            <button
              key={m.key}
              onClick={() => setActiveMetric(m.key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                activeMetric === m.key
                  ? 'bg-accent text-black'
                  : 'bg-card text-text-secondary hover:bg-elevated'
              }`}
            >
              {m.label}
            </button>
          ))}
          {availableExtended.map((m) => (
            <button
              key={m.key}
              onClick={() => setActiveMetric(m.key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                activeMetric === m.key
                  ? 'bg-accent text-black'
                  : 'bg-card text-text-secondary hover:bg-elevated'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E1E1E" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#A0A0A0', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#1E1E1E' }}
              />
              <YAxis
                tick={{ fill: '#A0A0A0', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#1E1E1E' }}
                domain={['auto', 'auto']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#141414',
                  border: '1px solid #1E1E1E',
                  borderRadius: '0.75rem',
                  color: '#FAFAFA',
                  fontSize: 13,
                }}
                formatter={(value: number | undefined) => [`${value ?? ''} ${metric.unit}`, metric.label]}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={metric.color}
                strokeWidth={2}
                dot={{ fill: metric.color, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
