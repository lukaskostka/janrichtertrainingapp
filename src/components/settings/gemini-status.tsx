'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Sparkles } from 'lucide-react'
import { getGeminiStatus } from '@/lib/actions/settings'

export function GeminiStatus() {
  const [configured, setConfigured] = useState<boolean | null>(null)

  useEffect(() => {
    getGeminiStatus().then((status) => setConfigured(status.configured))
  }, [])

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-text-secondary" strokeWidth={1.5} />
          <div>
            <p className="text-sm font-medium text-text-primary">Gemini OCR</p>
            <p className="text-xs text-text-tertiary">Rozpoznávání InBody reportů</p>
          </div>
        </div>
        {configured === null ? (
          <span className="text-xs text-text-tertiary">Načítám...</span>
        ) : configured ? (
          <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
            Aktivní
          </span>
        ) : (
          <span className="rounded-full bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning">
            Nenakonfigurováno
          </span>
        )}
      </div>
    </Card>
  )
}
