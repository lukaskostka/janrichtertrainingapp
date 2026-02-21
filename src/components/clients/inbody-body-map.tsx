'use client'

import { useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { InBodyRecord, InBodyExtendedData, BodySegment, SegmentalEvaluation } from '@/types'

interface InBodyBodyMapProps {
  record: InBodyRecord
  compareRecord?: InBodyRecord
  initialMode?: 'lean' | 'fat'
}

type Mode = 'lean' | 'fat'

const SEGMENT_LABELS: Record<BodySegment, string> = {
  right_arm: 'Pravá paže',
  left_arm: 'Levá paže',
  trunk: 'Trup',
  right_leg: 'Pravá noha',
  left_leg: 'Levá noha',
}

const EVAL_LABELS: Record<SegmentalEvaluation, string> = {
  below: 'Pod normou',
  normal: 'Normální',
  above: 'Nad normou',
}

function getSegmentColor(evaluation: SegmentalEvaluation | null, mode: Mode): string {
  if (!evaluation) return '#6B7280' // gray fallback

  if (mode === 'lean') {
    switch (evaluation) {
      case 'above': return '#22C55E'  // green - good muscle
      case 'normal': return '#3B82F6' // blue - normal
      case 'below': return '#EF4444'  // red - low muscle
    }
  } else {
    // fat mode: above = too much fat (red), below = low fat (green)
    switch (evaluation) {
      case 'above': return '#F59E0B'  // orange - too much fat
      case 'normal': return '#3B82F6' // blue - normal
      case 'below': return '#22C55E'  // green - low fat
    }
  }
}

// Center coordinates for placing text labels on each segment
const SEGMENT_TEXT_POS: Record<BodySegment, { x: number; y: number }> = {
  left_arm: { x: 38, y: 195 },
  right_arm: { x: 162, y: 195 },
  trunk: { x: 100, y: 195 },
  left_leg: { x: 78, y: 320 },
  right_leg: { x: 122, y: 320 },
}

// Tooltip positions (offset from body)
const TOOLTIP_POS: Record<BodySegment, { x: number; y: number }> = {
  left_arm: { x: -10, y: 160 },
  right_arm: { x: 140, y: 160 },
  trunk: { x: 50, y: 120 },
  left_leg: { x: -10, y: 290 },
  right_leg: { x: 140, y: 290 },
}

const SEGMENTS: BodySegment[] = ['left_arm', 'right_arm', 'trunk', 'left_leg', 'right_leg']

// SVG paths for a clean front-view human silhouette
const BODY_PATHS: Record<BodySegment, string> = {
  // Left arm (viewer's left = anatomical right arm)
  left_arm:
    'M58,135 C50,137 42,142 38,150 L30,175 C28,182 26,190 25,198 C24,206 24,214 26,220 L30,228 C32,232 35,234 38,233 L42,230 C44,228 46,224 47,218 L50,200 C51,195 53,190 55,186 L60,170 L62,155 Z',
  // Right arm (viewer's right = anatomical left arm)
  right_arm:
    'M142,135 C150,137 158,142 162,150 L170,175 C172,182 174,190 175,198 C176,206 176,214 174,220 L170,228 C168,232 165,234 162,233 L158,230 C156,228 154,224 153,218 L150,200 C149,195 147,190 145,186 L140,170 L138,155 Z',
  // Trunk / torso
  trunk:
    'M62,135 L60,170 L55,186 C58,200 60,215 62,230 L64,250 C66,258 68,262 72,264 L80,266 L100,268 L120,266 L128,264 C132,262 134,258 136,250 L138,230 C140,215 142,200 145,186 L140,170 L138,135 L130,130 C120,127 110,126 100,126 C90,126 80,127 70,130 Z',
  // Left leg
  left_leg:
    'M64,250 L62,230 C60,240 60,250 62,260 L64,280 C66,295 68,310 69,325 L70,340 C70,350 71,360 72,370 L72,380 C72,385 74,388 78,388 L84,388 C87,388 88,386 88,382 L88,370 C87,360 87,350 86,340 L84,320 C83,305 82,290 80,275 L80,266 L100,268 L100,270 C98,280 96,295 94,310 L92,330 C90,345 89,360 88,370 Z',
  // Right leg
  right_leg:
    'M136,250 L138,230 C140,240 140,250 138,260 L136,280 C134,295 132,310 131,325 L130,340 C130,350 129,360 128,370 L128,380 C128,385 126,388 122,388 L116,388 C113,388 112,386 112,382 L112,370 C113,360 113,350 114,340 L116,320 C117,305 118,290 120,275 L120,266 L100,268 L100,270 C102,280 104,295 106,310 L108,330 C110,345 111,360 112,370 Z',
}

// Head path (decorative, not clickable)
const HEAD_PATH =
  'M100,126 C90,126 80,127 70,130 L68,126 C66,118 66,108 68,100 C70,88 78,78 88,74 C92,72 96,71 100,71 C104,71 108,72 112,74 C122,78 130,88 132,100 C134,108 134,118 132,126 L130,130 C120,127 110,126 100,126 Z'

export function InBodyBodyMap({ record, compareRecord, initialMode = 'lean' }: InBodyBodyMapProps) {
  const [mode, setMode] = useState<Mode>(initialMode)
  const [selectedSegment, setSelectedSegment] = useState<BodySegment | null>(null)

  const customData = record.custom_data as InBodyExtendedData | null
  const compareData = compareRecord?.custom_data as InBodyExtendedData | null

  const segmentalData = mode === 'lean' ? customData?.segmental_lean : customData?.segmental_fat
  const compareSegmental = mode === 'lean' ? compareData?.segmental_lean : compareData?.segmental_fat

  const handleSegmentClick = useCallback((segment: BodySegment) => {
    setSelectedSegment((prev) => (prev === segment ? null : segment))
  }, [])

  const handleBackgroundClick = useCallback(() => {
    setSelectedSegment(null)
  }, [])

  if (!segmentalData) return null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setMode('lean'); setSelectedSegment(null) }}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              mode === 'lean'
                ? 'bg-accent text-black'
                : 'bg-card text-text-secondary hover:bg-elevated'
            }`}
          >
            Svalova hmota
          </button>
          <button
            onClick={() => { setMode('fat'); setSelectedSegment(null) }}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              mode === 'fat'
                ? 'bg-accent text-black'
                : 'bg-card text-text-secondary hover:bg-elevated'
            }`}
          >
            Tuk
          </button>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="relative flex justify-center">
          <svg
            viewBox="0 0 200 400"
            className="h-[320px] w-auto"
            onClick={handleBackgroundClick}
          >
            {/* Head (decorative) */}
            <path
              d={HEAD_PATH}
              fill="#374151"
              fillOpacity={0.4}
              stroke="#6B7280"
              strokeWidth={0.8}
            />

            {/* Body segments */}
            {SEGMENTS.map((segment) => {
              const entry = segmentalData[segment]
              const color = getSegmentColor(entry?.evaluation ?? null, mode)

              return (
                <g
                  key={segment}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSegmentClick(segment)
                  }}
                  className="cursor-pointer"
                >
                  <path
                    d={BODY_PATHS[segment]}
                    fill={color}
                    fillOpacity={selectedSegment === segment ? 0.6 : 0.35}
                    stroke={selectedSegment === segment ? '#FFFFFF' : '#6B7280'}
                    strokeWidth={selectedSegment === segment ? 1.5 : 0.8}
                    className="transition-all duration-200"
                  />
                  {/* Mass value text */}
                  {entry?.mass_kg != null && (
                    <text
                      x={SEGMENT_TEXT_POS[segment].x}
                      y={SEGMENT_TEXT_POS[segment].y}
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize={9}
                      fontWeight={500}
                    >
                      {entry.mass_kg.toFixed(1)}
                    </text>
                  )}
                  {/* Delta indicator */}
                  {compareSegmental && entry?.mass_kg != null && compareSegmental[segment]?.mass_kg != null && (
                    <DeltaText
                      x={SEGMENT_TEXT_POS[segment].x}
                      y={SEGMENT_TEXT_POS[segment].y + 12}
                      current={entry.mass_kg}
                      previous={compareSegmental[segment].mass_kg!}
                      mode={mode}
                    />
                  )}
                </g>
              )
            })}
          </svg>

          {/* Tooltip overlay */}
          <AnimatePresence>
            {selectedSegment && segmentalData[selectedSegment] && (
              <motion.div
                key={selectedSegment}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
                className="absolute z-10 rounded-xl border border-border bg-elevated px-3 py-2 shadow-lg"
                style={{
                  left: `calc(50% + ${TOOLTIP_POS[selectedSegment].x - 100}px)`,
                  top: `${TOOLTIP_POS[selectedSegment].y}px`,
                }}
              >
                <p className="text-xs font-medium text-text-primary">
                  {SEGMENT_LABELS[selectedSegment]}
                </p>
                <p className="mt-0.5 text-xs text-text-secondary">
                  {segmentalData[selectedSegment].mass_kg != null
                    ? `${segmentalData[selectedSegment].mass_kg!.toFixed(1)} kg`
                    : '---'}
                </p>
                {segmentalData[selectedSegment].evaluation && (
                  <p className="mt-0.5 text-xs text-text-tertiary">
                    {EVAL_LABELS[segmentalData[selectedSegment].evaluation!]}
                  </p>
                )}
                {compareSegmental &&
                  segmentalData[selectedSegment].mass_kg != null &&
                  compareSegmental[selectedSegment]?.mass_kg != null && (
                    <TooltipDelta
                      current={segmentalData[selectedSegment].mass_kg!}
                      previous={compareSegmental[selectedSegment].mass_kg!}
                      mode={mode}
                    />
                  )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-text-tertiary">
          <div className="flex items-center gap-1">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: mode === 'lean' ? '#22C55E' : '#F59E0B', opacity: 0.5 }}
            />
            {mode === 'lean' ? 'Nad normou' : 'Nad normou'}
          </div>
          <div className="flex items-center gap-1">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: '#3B82F6', opacity: 0.5 }}
            />
            Normalni
          </div>
          <div className="flex items-center gap-1">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: mode === 'lean' ? '#EF4444' : '#22C55E', opacity: 0.5 }}
            />
            {mode === 'lean' ? 'Pod normou' : 'Pod normou'}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function DeltaText({
  x,
  y,
  current,
  previous,
  mode,
}: {
  x: number
  y: number
  current: number
  previous: number
  mode: Mode
}) {
  const delta = current - previous
  if (Math.abs(delta) < 0.05) return null

  // For lean: increase is good (green), decrease is bad (red)
  // For fat: decrease is good (green), increase is bad (red)
  const isPositiveChange = mode === 'lean' ? delta > 0 : delta < 0
  const color = isPositiveChange ? '#22C55E' : '#EF4444'
  const arrow = delta > 0 ? '\u25B2' : '\u25BC'
  const text = `${arrow} ${delta > 0 ? '+' : ''}${delta.toFixed(1)}`

  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fill={color}
      fontSize={7}
      fontWeight={500}
    >
      {text}
    </text>
  )
}

function TooltipDelta({
  current,
  previous,
  mode,
}: {
  current: number
  previous: number
  mode: Mode
}) {
  const delta = current - previous
  if (Math.abs(delta) < 0.05) return null

  const isPositiveChange = mode === 'lean' ? delta > 0 : delta < 0
  const color = isPositiveChange ? '#22C55E' : '#EF4444'
  const arrow = delta > 0 ? '\u25B2' : '\u25BC'

  return (
    <p className="mt-0.5 text-xs font-medium" style={{ color }}>
      {arrow} {delta > 0 ? '+' : ''}{delta.toFixed(1)} kg
    </p>
  )
}
