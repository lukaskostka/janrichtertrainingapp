'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4 text-center">
      <AlertTriangle className="mb-6 h-16 w-16 text-danger" strokeWidth={1.5} />
      <h1 className="font-heading text-2xl font-bold text-text-primary">Nastala chyba</h1>
      <p className="mt-2 max-w-sm text-text-secondary">
        Omlouváme se, něco se pokazilo. Zkuste to prosím znovu.
      </p>
      <div className="mt-6">
        <Button onClick={reset}>Zkusit znovu</Button>
      </div>
    </div>
  )
}
