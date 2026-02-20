'use client'

import { motion, useReducedMotion } from 'framer-motion'

export function PageTransition({ children }: { children: React.ReactNode }) {
  const shouldReduce = useReducedMotion()
  return (
    <motion.div
      initial={shouldReduce ? { opacity: 1 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
