'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { hapticFeedback } from '@/lib/haptics'
import { NAV_ITEMS } from '@/lib/constants'

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card">
      <div className="flex items-center justify-around">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => hapticFeedback('light')}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-2 pt-3 text-xs transition-colors',
                isActive ? 'text-accent' : 'text-text-tertiary'
              )}
            >
              <item.icon className="h-5 w-5" strokeWidth={1.5} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  )
}
