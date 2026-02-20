'use client'

import { WifiOff } from 'lucide-react'

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4 text-center">
      <WifiOff className="mb-6 h-16 w-16 text-text-tertiary" strokeWidth={1.5} />
      <h1 className="font-heading text-2xl font-bold text-text-primary">Jste offline</h1>
      <p className="mt-2 max-w-sm text-text-secondary">
        Pro fungování aplikace je potřeba internetové připojení. Zkontrolujte své připojení a zkuste to znovu.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-6 rounded-xl bg-accent px-6 py-3 font-medium text-black transition-opacity hover:opacity-90"
      >
        Zkusit znovu
      </button>
    </div>
  )
}
