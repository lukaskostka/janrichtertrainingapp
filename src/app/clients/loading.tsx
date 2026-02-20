import { AppShell } from '@/components/layout/app-shell'
import { Skeleton, CardSkeleton } from '@/components/ui/skeleton'

export default function ClientsLoading() {
  return (
    <AppShell>
      {/* PageHeader skeleton */}
      <div className="flex items-center justify-between px-4 py-4">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>

      <div className="px-4">
        {/* Search input skeleton */}
        <Skeleton className="mb-4 h-11 w-full rounded-xl" />

        {/* Status filter pills skeleton */}
        <div className="mb-4 flex gap-2">
          <Skeleton className="h-8 w-12 rounded-full" />
          <Skeleton className="h-8 w-16 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>

        {/* Client cards skeleton */}
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    </AppShell>
  )
}
