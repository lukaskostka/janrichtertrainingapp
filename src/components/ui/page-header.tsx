import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  backHref?: string
  rightAction?: React.ReactNode
  className?: string
}

export function PageHeader({ title, backHref, rightAction, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between px-4 py-4', className)}>
      <div className="flex items-center gap-3">
        {backHref && (
          <Link
            href={backHref}
            className="rounded-lg p-1 text-text-tertiary transition-colors hover:text-text-primary"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
          </Link>
        )}
        <h1 className="font-heading text-xl font-bold text-text-primary">{title}</h1>
      </div>
      {rightAction && <div>{rightAction}</div>}
    </div>
  )
}
