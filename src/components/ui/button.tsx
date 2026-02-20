'use client'

import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { hapticFeedback } from '@/lib/haptics'
import { Loader2 } from 'lucide-react'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-black font-semibold hover:bg-accent-hover',
  secondary: 'border border-border bg-card text-text-primary hover:bg-elevated',
  danger: 'bg-danger text-white hover:opacity-90',
  ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-card',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, onClick, ...props }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      hapticFeedback('light')
      onClick?.(e)
    }

    return (
      <motion.div whileTap={{ scale: 0.97 }} className="inline-block">
        <button
          ref={ref}
          className={cn(
            'inline-flex items-center justify-center font-medium transition-all disabled:opacity-50 disabled:pointer-events-none',
            variantStyles[variant],
            sizeStyles[size],
            className
          )}
          disabled={disabled || loading}
          onClick={handleClick}
          {...props}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {children}
        </button>
      </motion.div>
    )
  }
)
Button.displayName = 'Button'
