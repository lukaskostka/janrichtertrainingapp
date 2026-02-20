import { AppShell } from '@/components/layout/app-shell'
import { Skeleton, SessionCardSkeleton } from '@/components/ui/skeleton'

export default function CalendarLoading() {
  return (
    <AppShell>
      {/* PageHeader skeleton */}
      <div className="flex items-center justify-between px-4 py-4">
        <Skeleton className="h-6 w-20" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>
      </div>

      {/* View toggle skeleton */}
      <div className="flex gap-1 px-4 pb-4">
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 flex-1 rounded-lg" />
      </div>

      {/* Week day headers skeleton */}
      <div className="grid grid-cols-7 gap-1 px-4 pb-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <Skeleton className="h-3 w-5" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        ))}
      </div>

      {/* Session cards skeleton */}
      <div className="space-y-2 px-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <SessionCardSkeleton key={i} />
        ))}
      </div>
    </AppShell>
  )
}
