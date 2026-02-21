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
  if (!evaluation) return '#4B5563'
  if (mode === 'lean') {
    switch (evaluation) {
      case 'above': return '#22C55E'
      case 'normal': return '#3B82F6'
      case 'below': return '#EF4444'
    }
  } else {
    switch (evaluation) {
      case 'above': return '#F59E0B'
      case 'normal': return '#3B82F6'
      case 'below': return '#22C55E'
    }
  }
}

function getSegmentFillOpacity(evaluation: SegmentalEvaluation | null, isSelected: boolean): number {
  if (isSelected) return 0.55
  if (!evaluation) return 0.2
  return 0.35
}

// Label positions for each segment (centered on segment area)
const SEGMENT_LABEL_POS: Record<BodySegment, { x: number; y: number }> = {
  left_arm: { x: 28, y: 185 },
  right_arm: { x: 172, y: 185 },
  trunk: { x: 100, y: 190 },
  left_leg: { x: 75, y: 320 },
  right_leg: { x: 125, y: 320 },
}

const SEGMENTS: BodySegment[] = ['left_arm', 'right_arm', 'trunk', 'left_leg', 'right_leg']

// Clean, proportional front-view silhouette paths
// ViewBox: 0 0 200 420
const BODY_PATHS: Record<BodySegment, string> = {
  // Left arm (viewer's left)
  left_arm: [
    'M 62 142',
    'C 58 144, 52 148, 48 155',
    'L 40 172',
    'C 36 180, 32 190, 30 200',
    'C 28 210, 27 220, 28 228',
    'C 29 234, 32 238, 36 238',
    'C 40 238, 42 234, 43 228',
    'L 46 210',
    'C 48 200, 50 192, 53 185',
    'L 58 168',
    'L 63 152',
    'Z',
  ].join(' '),

  // Right arm (viewer's right)
  right_arm: [
    'M 138 142',
    'C 142 144, 148 148, 152 155',
    'L 160 172',
    'C 164 180, 168 190, 170 200',
    'C 172 210, 173 220, 172 228',
    'C 171 234, 168 238, 164 238',
    'C 160 238, 158 234, 157 228',
    'L 154 210',
    'C 152 200, 150 192, 147 185',
    'L 142 168',
    'L 137 152',
    'Z',
  ].join(' '),

  // Trunk / torso
  trunk: [
    'M 63 142',
    'L 63 152',
    'L 58 168',
    'C 58 180, 58 195, 60 210',
    'C 62 225, 63 240, 65 255',
    'L 66 262',
    'C 70 268, 78 272, 88 273',
    'L 100 274',
    'L 112 273',
    'C 122 272, 130 268, 134 262',
    'L 135 255',
    'C 137 240, 138 225, 140 210',
    'C 142 195, 142 180, 142 168',
    'L 137 152',
    'L 138 142',
    'C 128 136, 116 132, 100 131',
    'C 84 132, 72 136, 63 142',
    'Z',
  ].join(' '),

  // Left leg
  left_leg: [
    'M 66 262',
    'C 63 268, 62 275, 62 282',
    'L 62 300',
    'C 62 315, 64 330, 66 345',
    'L 68 360',
    'C 69 370, 70 378, 70 385',
    'L 70 395',
    'C 70 400, 72 403, 76 403',
    'L 86 403',
    'C 89 403, 90 401, 90 397',
    'L 89 388',
    'C 88 378, 87 368, 86 358',
    'L 84 340',
    'C 82 325, 80 310, 80 295',
    'L 80 280',
    'L 88 273',
    'L 100 274',
    'L 100 278',
    'C 97 285, 95 300, 93 315',
    'L 91 340',
    'C 90 355, 89 370, 89 385',
    'L 89 388',
    'Z',
  ].join(' '),

  // Right leg
  right_leg: [
    'M 134 262',
    'C 137 268, 138 275, 138 282',
    'L 138 300',
    'C 138 315, 136 330, 134 345',
    'L 132 360',
    'C 131 370, 130 378, 130 385',
    'L 130 395',
    'C 130 400, 128 403, 124 403',
    'L 114 403',
    'C 111 403, 110 401, 110 397',
    'L 111 388',
    'C 112 378, 113 368, 114 358',
    'L 116 340',
    'C 118 325, 120 310, 120 295',
    'L 120 280',
    'L 112 273',
    'L 100 274',
    'L 100 278',
    'C 103 285, 105 300, 107 315',
    'L 109 340',
    'C 110 355, 111 370, 111 385',
    'L 111 388',
    'Z',
  ].join(' '),
}

const HEAD_OVAL = {
  cx: 100,
  cy: 96,
  rx: 18,
  ry: 22,
}

// Neck
const NECK_PATH = 'M 92 116 L 92 131 C 94 132, 97 132, 100 132 C 103 132, 106 132, 108 131 L 108 116'

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
            Svalová hmota
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
        <div className="relative flex justify-center" onClick={handleBackgroundClick}>
          <svg
            viewBox="0 0 200 420"
            className="h-[300px] w-auto"
          >
            <defs>
              {/* Subtle inner glow for segments */}
              <filter id="segGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
                <feFlood floodColor="white" floodOpacity="0.08" />
                <feComposite in2="blur" operator="in" />
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Head oval */}
            <ellipse
              cx={HEAD_OVAL.cx}
              cy={HEAD_OVAL.cy}
              rx={HEAD_OVAL.rx}
              ry={HEAD_OVAL.ry}
              fill="#2A2A2A"
              stroke="#404040"
              strokeWidth={1}
            />

            {/* Neck */}
            <path
              d={NECK_PATH}
              fill="#2A2A2A"
              stroke="#404040"
              strokeWidth={1}
            />

            {/* Body segments */}
            {SEGMENTS.map((segment) => {
              const entry = segmentalData[segment]
              const color = getSegmentColor(entry?.evaluation ?? null, mode)
              const isSelected = selectedSegment === segment
              const fillOpacity = getSegmentFillOpacity(entry?.evaluation ?? null, isSelected)

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
                    fillOpacity={fillOpacity}
                    stroke={isSelected ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.1)'}
                    strokeWidth={isSelected ? 1.5 : 0.5}
                    strokeLinejoin="round"
                    filter={isSelected ? 'url(#segGlow)' : undefined}
                    className="transition-all duration-200"
                  />
                  {/* Mass value */}
                  {entry?.mass_kg != null && (
                    <>
                      <text
                        x={SEGMENT_LABEL_POS[segment].x}
                        y={SEGMENT_LABEL_POS[segment].y}
                        textAnchor="middle"
                        fill="white"
                        fontSize={11}
                        fontWeight={600}
                        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
                      >
                        {entry.mass_kg.toFixed(1)}
                      </text>
                      <text
                        x={SEGMENT_LABEL_POS[segment].x}
                        y={SEGMENT_LABEL_POS[segment].y + 11}
                        textAnchor="middle"
                        fill="rgba(255,255,255,0.5)"
                        fontSize={7}
                        fontWeight={400}
                      >
                        kg
                      </text>
                    </>
                  )}
                  {/* Delta */}
                  {compareSegmental && entry?.mass_kg != null && compareSegmental[segment]?.mass_kg != null && (
                    <DeltaText
                      x={SEGMENT_LABEL_POS[segment].x}
                      y={SEGMENT_LABEL_POS[segment].y + 22}
                      current={entry.mass_kg}
                      previous={compareSegmental[segment].mass_kg!}
                      mode={mode}
                    />
                  )}
                </g>
              )
            })}
          </svg>

          {/* Tooltip */}
          <AnimatePresence>
            {selectedSegment && segmentalData[selectedSegment] && (
              <motion.div
                key={selectedSegment}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-2 left-4 right-4 z-10 rounded-xl border border-border bg-elevated/95 px-4 py-3 shadow-lg backdrop-blur-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-text-primary">
                    {SEGMENT_LABELS[selectedSegment]}
                  </p>
                  {segmentalData[selectedSegment].evaluation && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{
                        color: getSegmentColor(segmentalData[selectedSegment].evaluation!, mode),
                        backgroundColor: `${getSegmentColor(segmentalData[selectedSegment].evaluation!, mode)}20`,
                      }}
                    >
                      {EVAL_LABELS[segmentalData[selectedSegment].evaluation!]}
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-3">
                  <span className="text-lg font-semibold text-text-primary">
                    {segmentalData[selectedSegment].mass_kg != null
                      ? `${segmentalData[selectedSegment].mass_kg!.toFixed(1)} kg`
                      : '—'}
                  </span>
                  {compareSegmental &&
                    segmentalData[selectedSegment].mass_kg != null &&
                    compareSegmental[selectedSegment]?.mass_kg != null && (
                      <TooltipDelta
                        current={segmentalData[selectedSegment].mass_kg!}
                        previous={compareSegmental[selectedSegment].mass_kg!}
                        mode={mode}
                      />
                    )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Legend */}
        <div className="mt-2 flex items-center justify-center gap-4 text-[10px] text-text-tertiary">
          <LegendItem
            color={mode === 'lean' ? '#22C55E' : '#F59E0B'}
            label="Nad normou"
          />
          <LegendItem
            color="#3B82F6"
            label="Normální"
          />
          <LegendItem
            color={mode === 'lean' ? '#EF4444' : '#22C55E'}
            label="Pod normou"
          />
        </div>
      </CardContent>
    </Card>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ backgroundColor: color, opacity: 0.7 }}
      />
      {label}
    </div>
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

  const isPositiveChange = mode === 'lean' ? delta > 0 : delta < 0
  const color = isPositiveChange ? '#22C55E' : '#EF4444'
  const sign = delta > 0 ? '+' : ''

  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fill={color}
      fontSize={7}
      fontWeight={600}
    >
      {sign}{delta.toFixed(1)}
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
  const colorClass = isPositiveChange ? 'text-success' : 'text-danger'
  const sign = delta > 0 ? '+' : ''

  return (
    <span className={`text-sm font-medium ${colorClass}`}>
      {sign}{delta.toFixed(1)} kg
    </span>
  )
}
