import { cn } from '@/lib/utils'

type CardProps = React.HTMLAttributes<HTMLDivElement>

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn('rounded-2xl border border-border bg-card', className)}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: CardProps) {
  return (
    <div className={cn('px-4 pt-4 pb-2', className)} {...props} />
  )
}

export function CardContent({ className, ...props }: CardProps) {
  return (
    <div className={cn('px-4 py-2', className)} {...props} />
  )
}

export function CardFooter({ className, ...props }: CardProps) {
  return (
    <div className={cn('px-4 pt-2 pb-4', className)} {...props} />
  )
}
