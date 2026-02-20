'use client'

import { useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface Tab {
  id: string
  label: string
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (id: string) => void
  className?: string
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const currentIndex = tabs.findIndex((t) => t.id === activeTab)
      let nextIndex: number | null = null

      switch (e.key) {
        case 'ArrowRight':
          nextIndex = (currentIndex + 1) % tabs.length
          break
        case 'ArrowLeft':
          nextIndex = (currentIndex - 1 + tabs.length) % tabs.length
          break
        case 'Home':
          nextIndex = 0
          break
        case 'End':
          nextIndex = tabs.length - 1
          break
        default:
          return
      }

      e.preventDefault()
      const nextTab = tabs[nextIndex]
      onChange(nextTab.id)
      tabRefs.current.get(nextTab.id)?.focus()
    },
    [tabs, activeTab, onChange]
  )

  return (
    <div
      role="tablist"
      className={cn('flex border-b border-border', className)}
      onKeyDown={handleKeyDown}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            ref={(el) => {
              if (el) tabRefs.current.set(tab.id, el)
              else tabRefs.current.delete(tab.id)
            }}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative px-4 py-3 text-sm font-medium transition-colors',
              isActive
                ? 'text-accent'
                : 'text-text-tertiary hover:text-text-secondary'
            )}
          >
            {tab.label}
            {isActive && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-accent" />
            )}
          </button>
        )
      })}
    </div>
  )
}
