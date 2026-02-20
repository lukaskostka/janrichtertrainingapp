'use client'

import { useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  onCloseRequest?: () => void
  disableOverlayClose?: boolean
  title?: string
  children: React.ReactNode
  className?: string
}

export function BottomSheet({ isOpen, onClose, onCloseRequest, disableOverlayClose, title, children, className }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)

  const handleCloseRequest = useCallback(() => {
    if (onCloseRequest) {
      onCloseRequest()
    } else {
      onClose()
    }
  }, [onClose, onCloseRequest])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const sheet = sheetRef.current
    if (!sheet) return

    const closeBtn = sheet.querySelector('button')
    closeBtn?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseRequest()
        return
      }

      if (e.key !== 'Tab') return

      const focusableElements = sheet.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const focusable = Array.from(focusableElements).filter(el => !el.hasAttribute('disabled'))

      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleCloseRequest])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60"
            onClick={disableOverlayClose ? undefined : handleCloseRequest}
          />
          <motion.div
            ref={sheetRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="bottom-sheet-title"
            className={cn(
              'fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-border bg-card',
              className
            )}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-4 py-3">
              <h2 id="bottom-sheet-title" className="font-heading text-lg font-semibold text-text-primary">{title}</h2>
              <button
                onClick={handleCloseRequest}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-text-tertiary transition-colors hover:text-text-primary"
              >
                <X className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>
            <div className="px-4 py-4">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
