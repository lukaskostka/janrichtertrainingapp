import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="mb-1 block text-sm text-text-secondary">
            {label}
          </label>
        )}
        <textarea
          id={id}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            'w-full rounded-xl border bg-elevated px-4 py-3 text-text-primary placeholder-text-tertiary outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent',
            error ? 'border-danger' : 'border-border',
            className
          )}
          rows={3}
          {...props}
        />
        {error && (
          <p id={`${id}-error`} role="alert" className="mt-1 text-sm text-danger">{error}</p>
        )}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'
