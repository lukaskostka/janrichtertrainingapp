import { AppShell } from '@/components/layout/app-shell'
import { Skeleton } from '@/components/ui/skeleton'

export default function TemplatesLoading() {
  return (
    <AppShell>
      {/* PageHeader skeleton */}
      <div className="flex items-center justify-between px-4 py-4">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-8 w-16 rounded-lg" />
      </div>

      {/* Template cards skeleton */}
      <div className="space-y-3 px-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-14 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  )
}
