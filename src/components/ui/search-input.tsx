'use client'

import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string
}

export function SearchInput({ className, containerClassName, ...props }: SearchInputProps) {
  return (
    <div className={cn('relative', containerClassName)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" strokeWidth={1.5} />
      <input
        type="search"
        className={cn(
          'w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder-text-tertiary outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent',
          className
        )}
        {...props}
      />
    </div>
  )
}
