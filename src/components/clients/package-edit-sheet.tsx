'use client'

import { useState, useRef } from 'react'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { updatePackage } from '@/lib/actions/packages'
import { hapticSuccess } from '@/lib/haptics'
import type { Package } from '@/types'

interface PackageEditSheetProps {
  isOpen: boolean
  onClose: () => void
  pkg: Package
  onSuccess: () => void
}

const STATUS_OPTIONS = [
  { value: 'active', label: 'Aktivní' },
  { value: 'completed', label: 'Dokončený' },
  { value: 'expired', label: 'Expirovaný' },
]

export function PackageEditSheet({ isOpen, onClose, pkg, onSuccess }: PackageEditSheetProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const submittingRef = useRef(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (submittingRef.current) return
    submittingRef.current = true
    setLoading(true)
    setError(null)

    try {
      const form = new FormData(e.currentTarget)
      await updatePackage(pkg.id, pkg.client_id, {
        name: form.get('name') as string,
        total_sessions: parseInt(form.get('total_sessions') as string),
        used_sessions: parseInt(form.get('used_sessions') as string),
        price: form.get('price') ? parseFloat(form.get('price') as string) : null,
        status: form.get('status') as 'active' | 'completed' | 'expired',
      })
      hapticSuccess()
      onSuccess()
      onClose()
    } catch {
      setError('Nepodařilo se upravit balíček')
    } finally {
      setLoading(false)
      submittingRef.current = false
    }
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Upravit balíček">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="name"
          name="name"
          label="Název"
          defaultValue={pkg.name}
          required
        />
        <Input
          id="total_sessions"
          name="total_sessions"
          label="Celkem tréninků"
          type="number"
          min={1}
          defaultValue={pkg.total_sessions}
          required
        />
        <Input
          id="used_sessions"
          name="used_sessions"
          label="Využito tréninků"
          type="number"
          min={0}
          defaultValue={pkg.used_sessions}
          required
        />
        <Input
          id="price"
          name="price"
          label="Cena (Kč)"
          type="number"
          step="1"
          min={0}
          defaultValue={pkg.price ?? ''}
        />
        <Select
          id="status"
          name="status"
          label="Stav"
          options={STATUS_OPTIONS}
          defaultValue={pkg.status}
          required
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" loading={loading} className="w-full">
          Uložit změny
        </Button>
      </form>
    </BottomSheet>
  )
}
