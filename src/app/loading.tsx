import { AppShell } from '@/components/layout/app-shell'
import { Skeleton, StatsSkeleton, SessionCardSkeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <AppShell>
      <div className="space-y-6 px-4 pb-6">
        {/* Greeting header skeleton */}
        <div className="pt-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-32" />
          </div>
        </div>

        {/* Weekly overview skeleton */}
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <Skeleton className="h-3 w-5" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          ))}
        </div>

        {/* Today's sessions section */}
        <section>
          <Skeleton className="mb-3 h-4 w-28" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <SessionCardSkeleton key={i} />
            ))}
          </div>
        </section>

        {/* Quick stats section */}
        <section>
          <Skeleton className="mb-3 h-4 w-16" />
          <StatsSkeleton />
        </section>

        {/* Quick actions section */}
        <section>
          <Skeleton className="mb-3 h-4 w-20" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-14 rounded-2xl" />
            <Skeleton className="h-14 rounded-2xl" />
          </div>
        </section>
      </div>
    </AppShell>
  )
}
