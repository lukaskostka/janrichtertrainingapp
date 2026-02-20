'use client'

import { useState, useMemo } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import type { InBodyRecord } from '@/types'

interface InBodyChartProps {
  records: InBodyRecord[]
}

type MetricKey = 'weight' | 'body_fat_pct' | 'muscle_mass'

const METRICS: { key: MetricKey; label: string; unit: string; color: string }[] = [
  { key: 'weight', label: 'Váha', unit: 'kg', color: '#FFFFFF' },
  { key: 'body_fat_pct', label: 'Tělesný tuk', unit: '%', color: '#F59E0B' },
  { key: 'muscle_mass', label: 'Svalová hmota', unit: 'kg', color: '#22C55E' },
]

export function InBodyChart({ records }: InBodyChartProps) {
  const [activeMetric, setActiveMetric] = useState<MetricKey>('weight')

  // Sort chronologically for the chart (oldest first)
  const sorted = useMemo(
    () => [...records].sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime()),
    [records]
  )

  const metric = METRICS.find((m) => m.key === activeMetric)!

  const chartData = useMemo(
    () => sorted.filter((r) => r[activeMetric] != null).map((r) => ({ date: formatDate(r.measured_at), value: r[activeMetric] as number })),
    [sorted, activeMetric]
  )

  if (chartData.length < 2) return null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          {METRICS.map((m) => (
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
