import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-border',
        className
      )}
    />
  )
}

export function CardSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('rounded-2xl border border-border bg-card p-4', className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  )
}

export function ListSkeleton({ count = 3, className }: SkeletonProps & { count?: number }) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-card p-3">
          <Skeleton className="mb-2 h-5 w-5" />
          <Skeleton className="mb-1 h-6 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  )
}

export function SessionCardSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-3 py-2.5">
      <Skeleton className="h-4 w-10" />
      <Skeleton className="h-4 flex-1" />
    </div>
  )
}

export function FormSkeleton({ fields = 3 }: { fields?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i}>
          <Skeleton className="mb-1 h-4 w-20" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      ))}
      <Skeleton className="h-11 w-full rounded-xl" />
    </div>
  )
}
