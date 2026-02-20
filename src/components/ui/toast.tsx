'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning'

interface Toast {
  id: string
  message: string
  type: ToastType
  action?: string
  onAction?: () => void
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, options?: { action?: string; onAction?: () => void; duration?: number }) => void
  toast: (message: string, type?: ToastType, options?: { action?: string; onAction?: () => void; duration?: number }) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'success', options?: { action?: string; onAction?: () => void; duration?: number }) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, message, type, action: options?.action, onAction: options?.onAction }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, options?.duration ?? 4000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 className="h-4 w-4 text-success" strokeWidth={1.5} />,
    error: <AlertCircle className="h-4 w-4 text-danger" strokeWidth={1.5} />,
    warning: <AlertTriangle className="h-4 w-4 text-warning" strokeWidth={1.5} />,
  }

  const colors: Record<ToastType, string> = {
    success: 'border-success/30 bg-success/10 text-success',
    error: 'border-danger/30 bg-danger/10 text-danger',
    warning: 'border-warning/30 bg-warning/10 text-warning',
  }

  return (
    <ToastContext.Provider value={{ showToast, toast: showToast }}>
      {children}
      <div role="status" aria-live="polite" aria-atomic="true" className="fixed bottom-20 left-4 right-4 z-[100] flex flex-col items-center gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto flex w-full max-w-sm items-center gap-2 rounded-xl border px-4 py-3 shadow-lg ${colors[toast.type]}`}
            >
              {icons[toast.type]}
              <span className="flex-1 text-sm font-medium">{toast.message}</span>
              {toast.action && toast.onAction && (
                <button
                  onClick={() => {
                    toast.onAction?.()
                    removeToast(toast.id)
                  }}
                  className="flex-shrink-0 text-sm font-semibold underline underline-offset-2 hover:opacity-80"
                >
                  {toast.action}
                </button>
              )}
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 opacity-60 hover:opacity-100"
                aria-label="Zavřít upozornění"
              >
                <X className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
