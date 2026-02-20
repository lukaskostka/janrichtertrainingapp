'use client'

import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion'

const springTransition = { type: 'spring' as const, stiffness: 300, damping: 24 }

// Staggered list container
export function StaggerList({
  children,
  className,
  ...props
}: HTMLMotionProps<'div'>) {
  const shouldReduce = useReducedMotion()
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: shouldReduce ? 0 : 0.06,
          },
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// Staggered list item
export function StaggerItem({
  children,
  className,
  ...props
}: HTMLMotionProps<'div'>) {
  const shouldReduce = useReducedMotion()
  return (
    <motion.div
      variants={
        shouldReduce
          ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
          : { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }
      }
      transition={springTransition}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// Scale on tap (for interactive cards/buttons)
export function ScaleTap({
  children,
  className,
  ...props
}: HTMLMotionProps<'div'>) {
  const shouldReduce = useReducedMotion()
  return (
    <motion.div
      whileTap={shouldReduce ? {} : { scale: 0.97 }}
      transition={{ duration: 0.1 }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// Scale in animation (for stats/numbers)
export function ScaleIn({
  children,
  className,
  delay = 0,
  ...props
}: HTMLMotionProps<'div'> & { delay?: number }) {
  const shouldReduce = useReducedMotion()
  return (
    <motion.div
      initial={shouldReduce ? { opacity: 1 } : { opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ ...springTransition, delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}
