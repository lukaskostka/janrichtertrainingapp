'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { createSessionAction } from '@/lib/actions/sessions'
import { toUtcIsoFromLocalInput } from '@/lib/datetime'
import { getActivePackage } from '@/lib/actions/packages'
import { hapticSuccess } from '@/lib/haptics'
import type { Client } from '@/types'

interface SessionFormProps {
  clients: Pick<Client, 'id' | 'name'>[]
}

export function SessionForm({ clients }: SessionFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [noPackageWarning, setNoPackageWarning] = useState(false)
  const [pastDateWarning, setPastDateWarning] = useState(false)
  const submittingRef = useRef(false)

  const clientOptions = clients.map((c) => ({ value: c.id, label: c.name }))

  async function handleClientChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const clientId = e.target.value
    if (!clientId) {
      setNoPackageWarning(false)
      return
    }
    try {
      const pkg = await getActivePackage(clientId)
      setNoPackageWarning(!pkg)
    } catch {
      setNoPackageWarning(false)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (submittingRef.current) return
    submittingRef.current = true
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData(e.currentTarget)
      const localDateTime = formData.get('scheduled_at') as string
      if (localDateTime) {
        formData.set('scheduled_at', toUtcIsoFromLocalInput(localDateTime))
      }
      await createSessionAction(formData)
      hapticSuccess()
      router.push('/calendar')
    } catch {
      setError('Nepodařilo se vytvořit trénink')
    } finally {
      setLoading(false)
      submittingRef.current = false
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 px-4">
      <Select
        id="client_id"
        name="client_id"
        label="Klient"
        options={clientOptions}
        placeholder="Vyberte klienta"
        required
        onChange={handleClientChange}
      />

      {noPackageWarning && (
        <div className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2.5">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning" strokeWidth={1.5} />
          <p className="text-xs text-warning">
            Tento klient nemá aktivní balíček. Trénink nebude propojen s žádným balíčkem.
          </p>
        </div>
      )}

      <Input
        id="scheduled_at"
        name="scheduled_at"
        label="Datum a čas"
        type="datetime-local"
        required
        onChange={(e) => {
          const val = e.target.value
          if (val) {
            setPastDateWarning(new Date(val) < new Date())
          } else {
            setPastDateWarning(false)
          }
        }}
      />

      {pastDateWarning && (
        <div className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2.5">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning" strokeWidth={1.5} />
          <p className="text-xs text-warning">
            Plánujete trénink v minulosti.
          </p>
        </div>
      )}

      <Input
        id="location"
        name="location"
        label="Místo"
        placeholder="Např. Gym XY"
      />

      <Textarea
        id="notes"
        name="notes"
        label="Poznámky"
        placeholder="Volitelné poznámky..."
      />

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button type="submit" loading={loading} className="w-full">
        Naplánovat trénink
      </Button>
    </form>
  )
}
