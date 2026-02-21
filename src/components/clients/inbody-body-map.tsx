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

// Label anchor positions for each segment
const LABEL_POS: Record<BodySegment, { x: number; y: number }> = {
  left_arm: { x: 42, y: 178 },
  right_arm: { x: 158, y: 178 },
  trunk: { x: 100, y: 170 },
  left_leg: { x: 78, y: 325 },
  right_leg: { x: 122, y: 325 },
}

const SEGMENTS: BodySegment[] = ['left_arm', 'right_arm', 'trunk', 'left_leg', 'right_leg']

// ── SVG Paths ────────────────────────────────────────────────
// ViewBox 200×440 — athletic male, front view
// Proportions referenced from anatomical SVG (861×1675)

// Head: simple ellipse at (100, 34), rx=16, ry=20
const HEAD = { cx: 100, cy: 34, rx: 16, ry: 20 }

// Neck
const NECK = 'M 90,53 L 90,66 C 93,68 97,69 100,69 C 103,69 107,68 110,66 L 110,53'

// Left arm (viewer's left = subject's right arm)
const ARM_L = [
  'M 60,80',               // shoulder joint
  'C 55,82 48,90 44,100',  // deltoid curve out
  'C 40,110 36,122 34,135', // upper arm
  'C 32,148 30,160 30,172', // toward elbow
  'C 30,180 30,186 32,192', // elbow
  'C 33,200 34,210 34,218', // forearm
  'C 34,226 33,234 32,240', // lower forearm
  'C 31,246 30,250 30,254', // wrist
  'L 27,258',               // hand outer
  'C 26,262 27,266 30,268', // hand bottom
  'C 33,270 37,268 40,264', // hand inner
  'C 41,260 42,254 42,248', // wrist inner
  'C 43,240 44,230 45,222', // inner forearm
  'C 46,212 48,202 49,194', // inner forearm upper
  'C 50,186 52,178 53,172', // inner elbow
  'C 55,160 57,148 58,136', // inner upper arm
  'C 59,124 60,112 61,102', // inner bicep
  'C 62,94 62,88 62,82',   // armpit area
  'Z',
].join(' ')

// Right arm (mirror)
const ARM_R = [
  'M 140,80',
  'C 145,82 152,90 156,100',
  'C 160,110 164,122 166,135',
  'C 168,148 170,160 170,172',
  'C 170,180 170,186 168,192',
  'C 167,200 166,210 166,218',
  'C 166,226 167,234 168,240',
  'C 169,246 170,250 170,254',
  'L 173,258',
  'C 174,262 173,266 170,268',
  'C 167,270 163,268 160,264',
  'C 159,260 158,254 158,248',
  'C 157,240 156,230 155,222',
  'C 154,212 152,202 151,194',
  'C 150,186 148,178 147,172',
  'C 145,160 143,148 142,136',
  'C 141,124 140,112 139,102',
  'C 138,94 138,88 138,82',
  'Z',
].join(' ')

// Trunk / torso
const TRUNK = [
  // Top: shoulder line (connects between arm gaps)
  'M 62,80',                 // left shoulder inner (armpit top)
  'C 62,76 66,72 72,70',    // left shoulder
  'L 88,67',                 // left neck base
  'C 93,68 97,69 100,69',   // neck center
  'C 103,69 107,68 112,67', // right neck base
  'L 128,70',                // right shoulder
  'C 134,72 138,76 138,80', // right shoulder inner

  // Right side down
  'C 138,88 138,94 139,102', // right armpit
  'C 140,112 142,125 142,138', // right chest
  'C 142,150 141,162 140,172', // right rib cage
  'C 138,182 136,190 134,196', // right waist
  'C 132,204 132,210 134,218', // right hip
  'C 135,224 136,228 136,232', // right hip crease
  'L 120,238',               // inner right thigh start
  'L 100,244',               // crotch center

  // Left side up
  'L 80,238',                // inner left thigh start
  'L 64,232',                // left hip crease
  'C 64,228 65,224 66,218', // left hip
  'C 68,210 68,204 66,196', // left waist
  'C 64,190 62,182 60,172', // left rib cage
  'C 59,162 58,150 58,138', // left chest
  'C 58,125 60,112 61,102', // left armpit
  'C 62,94 62,88 62,80',   // back to start
  'Z',
].join(' ')

// Left leg
const LEG_L = [
  'M 64,232',                // left hip crease
  'C 64,228 65,224 66,218', // hip curve outward
  'C 66,224 64,234 62,244', // outer thigh start
  'C 58,262 56,282 56,300', // outer thigh
  'C 56,314 57,326 58,336', // outer knee
  'C 59,348 60,360 62,372', // outer calf
  'C 63,382 64,390 66,398', // outer lower calf
  'C 67,404 68,408 68,412', // outer ankle
  'L 64,418',                // foot outer
  'C 62,420 62,424 64,426', // foot bottom outer
  'L 88,426',                // foot bottom inner
  'C 90,424 90,420 88,418', // foot bottom inner curve
  'L 84,412',                // inner ankle
  'C 84,408 84,404 84,398', // inner lower calf
  'C 86,390 88,382 89,372', // inner calf
  'C 90,360 92,348 92,336', // inner knee
  'C 92,326 93,314 94,300', // inner thigh lower
  'C 95,282 96,264 98,248', // inner thigh upper
  'L 100,244',               // crotch center
  'L 80,238',                // inner thigh start
  'Z',
].join(' ')

// Right leg (mirror)
const LEG_R = [
  'M 136,232',
  'C 136,228 135,224 134,218',
  'C 134,224 136,234 138,244',
  'C 142,262 144,282 144,300',
  'C 144,314 143,326 142,336',
  'C 141,348 140,360 138,372',
  'C 137,382 136,390 134,398',
  'C 133,404 132,408 132,412',
  'L 136,418',
  'C 138,420 138,424 136,426',
  'L 112,426',
  'C 110,424 110,420 112,418',
  'L 116,412',
  'C 116,408 116,404 116,398',
  'C 114,390 112,382 111,372',
  'C 110,360 108,348 108,336',
  'C 108,326 107,314 106,300',
  'C 105,282 104,264 102,248',
  'L 100,244',
  'L 120,238',
  'Z',
].join(' ')

const BODY_PATHS: Record<BodySegment, string> = {
  left_arm: ARM_L,
  right_arm: ARM_R,
  trunk: TRUNK,
  left_leg: LEG_L,
  right_leg: LEG_R,
}

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

  if (!segmentalData) return null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          {(['lean', 'fat'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setSelectedSegment(null) }}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                mode === m
                  ? 'bg-accent text-black'
                  : 'bg-card text-text-secondary hover:bg-elevated'
              }`}
            >
              {m === 'lean' ? 'Svalová hmota' : 'Tuk'}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div
          className="relative flex justify-center"
          onClick={() => setSelectedSegment(null)}
        >
          <svg viewBox="0 0 200 440" className="h-[310px] w-auto">
            {/* Head */}
            <ellipse
              cx={HEAD.cx} cy={HEAD.cy} rx={HEAD.rx} ry={HEAD.ry}
              fill="#1F1F1F"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={0.75}
            />
            {/* Neck */}
            <path
              d={NECK}
              fill="#1F1F1F"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={0.75}
            />

            {/* Segments */}
            {SEGMENTS.map((seg) => {
              const entry = segmentalData[seg]
              const color = getSegmentColor(entry?.evaluation ?? null, mode)
              const selected = selectedSegment === seg

              return (
                <g
                  key={seg}
                  onClick={(e) => { e.stopPropagation(); handleSegmentClick(seg) }}
                  className="cursor-pointer"
                >
                  <path
                    d={BODY_PATHS[seg]}
                    fill={color}
                    fillOpacity={selected ? 0.5 : 0.25}
                    stroke={selected ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.08)'}
                    strokeWidth={selected ? 1.2 : 0.75}
                    strokeLinejoin="round"
                    className="transition-all duration-200"
                  />

                  {/* Value label */}
                  {entry?.mass_kg != null && (
                    <>
                      <text
                        x={LABEL_POS[seg].x}
                        y={LABEL_POS[seg].y}
                        textAnchor="middle"
                        fill="white"
                        fontSize={11}
                        fontWeight={600}
                        paintOrder="stroke"
                        stroke="rgba(0,0,0,0.6)"
                        strokeWidth={2.5}
                      >
                        {entry.mass_kg.toFixed(1)}
                      </text>
                      <text
                        x={LABEL_POS[seg].x}
                        y={LABEL_POS[seg].y + 12}
                        textAnchor="middle"
                        fill="rgba(255,255,255,0.45)"
                        fontSize={8}
                        fontWeight={400}
                      >
                        kg
                      </text>
                    </>
                  )}

                  {/* Delta vs previous */}
                  {compareSegmental && entry?.mass_kg != null && compareSegmental[seg]?.mass_kg != null && (
                    <SegmentDelta
                      x={LABEL_POS[seg].x}
                      y={LABEL_POS[seg].y + 24}
                      current={entry.mass_kg}
                      previous={compareSegmental[seg].mass_kg!}
                      mode={mode}
                    />
                  )}
                </g>
              )
            })}
          </svg>

          {/* Detail tooltip (bottom sheet style) */}
          <AnimatePresence>
            {selectedSegment && segmentalData[selectedSegment] && (
              <motion.div
                key={selectedSegment}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-2 left-3 right-3 z-10 rounded-xl border border-border bg-elevated/95 px-4 py-3 shadow-lg backdrop-blur-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text-primary">
                    {SEGMENT_LABELS[selectedSegment]}
                  </span>
                  {segmentalData[selectedSegment].evaluation && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{
                        color: getSegmentColor(segmentalData[selectedSegment].evaluation!, mode),
                        backgroundColor: `${getSegmentColor(segmentalData[selectedSegment].evaluation!, mode)}18`,
                      }}
                    >
                      {EVAL_LABELS[segmentalData[selectedSegment].evaluation!]}
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-baseline gap-3">
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
        <div className="mt-2 flex items-center justify-center gap-5 text-[10px] text-text-tertiary">
          <LegendDot
            color={mode === 'lean' ? '#22C55E' : '#F59E0B'}
            label="Nad normou"
          />
          <LegendDot color="#3B82F6" label="Normální" />
          <LegendDot
            color={mode === 'lean' ? '#EF4444' : '#22C55E'}
            label="Pod normou"
          />
        </div>
      </CardContent>
    </Card>
  )
}

/* ── Small helpers ────────────────────────────────────────── */

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ backgroundColor: color, opacity: 0.65 }}
      />
      {label}
    </div>
  )
}

function SegmentDelta({ x, y, current, previous, mode }: {
  x: number; y: number; current: number; previous: number; mode: Mode
}) {
  const d = current - previous
  if (Math.abs(d) < 0.05) return null
  const good = mode === 'lean' ? d > 0 : d < 0
  return (
    <text
      x={x} y={y}
      textAnchor="middle"
      fill={good ? '#22C55E' : '#EF4444'}
      fontSize={7}
      fontWeight={600}
    >
      {d > 0 ? '+' : ''}{d.toFixed(1)}
    </text>
  )
}

function TooltipDelta({ current, previous, mode }: {
  current: number; previous: number; mode: Mode
}) {
  const d = current - previous
  if (Math.abs(d) < 0.05) return null
  const good = mode === 'lean' ? d > 0 : d < 0
  return (
    <span className={`text-sm font-medium ${good ? 'text-success' : 'text-danger'}`}>
      {d > 0 ? '+' : ''}{d.toFixed(1)} kg
    </span>
  )
}
