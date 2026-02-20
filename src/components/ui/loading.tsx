import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeStyles = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
}

export function Loading({ className, size = 'md' }: LoadingProps) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <Loader2 className={cn('animate-spin text-text-tertiary', sizeStyles[size])} />
    </div>
  )
}

export function PageLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <Loading size="lg" />
    </div>
  )
}
