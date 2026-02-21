'use client'

import { useEffect } from 'react'
import { BottomNav } from './bottom-nav'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  useEffect(() => {
    try {
      const key = 'fitcoach:auto-complete'
      const now = Date.now()
      const last = Number(sessionStorage.getItem(key) || 0)
      if (now - last < 10 * 60 * 1000) return
      sessionStorage.setItem(key, String(now))
      fetch('/api/sessions/auto-complete', { method: 'POST' }).catch((err) => {
        console.warn('[auto-complete] Nepodařilo se spustit auto-complete:', err)
      })
    } catch {
      // Ignore storage access issues
    }
  }, [])

  return (
    <div className="min-h-screen bg-bg overflow-x-hidden">
      <main className="pb-20 overflow-x-hidden" style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}>{children}</main>
      <BottomNav />
    </div>
  )
}
