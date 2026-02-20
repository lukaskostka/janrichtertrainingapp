import { AppShell } from '@/components/layout/app-shell'
import { Skeleton, CardSkeleton } from '@/components/ui/skeleton'

export default function ExercisesLoading() {
  return (
    <AppShell>
      {/* PageHeader skeleton */}
      <div className="flex items-center justify-between px-4 py-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-16 rounded-lg" />
      </div>

      {/* Tabs skeleton */}
      <div className="flex border-b border-border px-4">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="ml-4 h-10 w-20" />
      </div>

      <div className="space-y-4 px-4 pt-4">
        {/* Search input skeleton */}
        <Skeleton className="h-11 w-full rounded-xl" />

        {/* Exercise cards skeleton */}
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    </AppShell>
  )
}
