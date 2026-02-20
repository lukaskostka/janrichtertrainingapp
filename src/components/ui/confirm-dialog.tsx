'use client'

import { BottomSheet } from './bottom-sheet'
import { Button } from './button'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'primary'
  loading?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Potvrdit',
  cancelLabel = 'Zrušit',
  variant = 'primary',
  loading,
}: ConfirmDialogProps) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={title}>
      {description && (
        <p className="mb-6 text-sm text-text-secondary">{description}</p>
      )}
      <div className="flex gap-3">
        <Button
          variant="secondary"
          onClick={onClose}
          className="flex-1"
          disabled={loading}
        >
          {cancelLabel}
        </Button>
        <Button
          variant={variant === 'danger' ? 'danger' : 'primary'}
          onClick={onConfirm}
          className="flex-1"
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </div>
    </BottomSheet>
  )
}
