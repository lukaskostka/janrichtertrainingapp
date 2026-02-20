import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, options, placeholder, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="mb-1 block text-sm text-text-secondary">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={id}
            ref={ref}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : undefined}
            className={cn(
              'w-full appearance-none rounded-xl border bg-elevated px-4 py-3 pr-10 text-text-primary outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent',
              error ? 'border-danger' : 'border-border',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
        </div>
        {error && (
          <p id={`${id}-error`} role="alert" className="mt-1 text-sm text-danger">{error}</p>
        )}
      </div>
    )
  }
)
Select.displayName = 'Select'
