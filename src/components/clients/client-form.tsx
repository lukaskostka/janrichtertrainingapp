'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { createClientAction, updateClientAction } from '@/lib/actions/clients'
import { hapticSuccess } from '@/lib/haptics'
import type { Client } from '@/types'

interface ClientFormProps {
  client?: Client
}

export function ClientForm({ client }: ClientFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const submittingRef = useRef(false)
  const isEditing = !!client

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (submittingRef.current) return
    submittingRef.current = true
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData(e.currentTarget)
      if (isEditing) {
        await updateClientAction(client.id, formData)
        hapticSuccess()
        router.push(`/clients/${client.id}`)
      } else {
        await createClientAction(formData)
        hapticSuccess()
        router.push('/clients')
      }
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
        label="Jméno *"
        required
        defaultValue={client?.name ?? ''}
        placeholder="Jan Novák"
      />

      <Input
        id="email"
        name="email"
        label="Email"
        type="email"
        defaultValue={client?.email ?? ''}
        placeholder="jan@email.cz"
      />

      <Input
        id="phone"
        name="phone"
        label="Telefon"
        type="tel"
        defaultValue={client?.phone ?? ''}
        placeholder="+420 123 456 789"
      />

      <Input
        id="birth_date"
        name="birth_date"
        label="Datum narození"
        type="date"
        defaultValue={client?.birth_date ?? ''}
      />

      {isEditing && (
        <Select
          id="status"
          name="status"
          label="Status"
          defaultValue={client.status}
          options={[
            { value: 'active', label: 'Aktivní' },
            { value: 'inactive', label: 'Neaktivní' },
            { value: 'archived', label: 'Archivovaný' },
          ]}
        />
      )}

      <Textarea
        id="notes"
        name="notes"
        label="Poznámky"
        defaultValue={client?.notes ?? ''}
        placeholder="Poznámky ke klientovi..."
      />

      <Button type="submit" loading={loading} className="w-full">
        {isEditing ? 'Uložit změny' : 'Vytvořit klienta'}
      </Button>
    </form>
  )
}
