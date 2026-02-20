import { AppShell } from '@/components/layout/app-shell'
import { Skeleton } from '@/components/ui/skeleton'

export default function SettingsLoading() {
  return (
    <AppShell>
      {/* PageHeader skeleton */}
      <div className="flex items-center justify-between px-4 py-4">
        <Skeleton className="h-6 w-24" />
      </div>

      <div className="space-y-6 px-4 pb-6">
        {/* Profile section */}
        <section>
          <Skeleton className="mb-3 h-4 w-12" />
          <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
            <div>
              <Skeleton className="mb-1 h-4 w-16" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
            <div>
              <Skeleton className="mb-1 h-4 w-12" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        </section>

        {/* Calendar section */}
        <section>
          <Skeleton className="mb-3 h-4 w-16" />
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        </section>

        {/* Sign out section */}
        <section>
          <Skeleton className="mb-3 h-4 w-20" />
          <div className="rounded-2xl border border-border bg-card p-4">
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        </section>
      </div>
    </AppShell>
  )
}
