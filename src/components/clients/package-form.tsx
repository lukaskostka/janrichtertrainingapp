'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createPackageAction } from '@/lib/actions/packages'
import { hapticSuccess } from '@/lib/haptics'

interface PackageFormProps {
  clientId: string
}

export function PackageForm({ clientId }: PackageFormProps) {
  const router = useRouter()
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
      const formData = new FormData(e.currentTarget)
      await createPackageAction(clientId, formData)
      hapticSuccess()
      router.push(`/clients/${clientId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nastala chyba')
    } finally {
      setLoading(false)
      submittingRef.current = false
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 px-4">
      {error && (
        <div className="rounded-xl border border-danger/50 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <Input
        id="name"
        name="name"
        label="Název balíčku *"
        required
        placeholder="např. Balíček 10 tréninků"
      />

      <Input
        id="total_sessions"
        name="total_sessions"
        label="Počet tréninků *"
        type="number"
        required
        min={1}
        placeholder="10"
      />

      <Input
        id="price"
        name="price"
        label="Cena (Kč)"
        type="number"
        min={0}
        step="1"
        placeholder="5000"
      />

      <Button type="submit" loading={loading} className="w-full">
        Vytvořit balíček
      </Button>
    </form>
  )
}
