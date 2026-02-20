'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { hapticSuccess } from '@/lib/haptics'
import { createRecurringSessions } from '@/lib/actions/recurring'
import { toPragueDate } from '@/lib/datetime'
import { format } from 'date-fns'
import type { Client } from '@/types'

interface RecurringSessionFormProps {
  clients: Pick<Client, 'id' | 'name'>[]
  onSuccess?: () => void
  onDirtyChange?: (dirty: boolean) => void
}

const DAY_OPTIONS = [
  { value: '1', label: 'Pondělí' },
  { value: '2', label: 'Úterý' },
  { value: '3', label: 'Středa' },
  { value: '4', label: 'Čtvrtek' },
  { value: '5', label: 'Pátek' },
  { value: '6', label: 'Sobota' },
  { value: '0', label: 'Neděle' },
]

const INTERVAL_OPTIONS = [
  { value: '1', label: 'Každý týden' },
  { value: '2', label: 'Každé 2 týdny' },
  { value: '3', label: 'Každé 3 týdny' },
  { value: '4', label: 'Každé 4 týdny' },
]

const COUNT_OPTIONS = [
  { value: '4', label: '4 opakování' },
  { value: '8', label: '8 opakování' },
  { value: '10', label: '10 opakování' },
  { value: '12', label: '12 opakování' },
  { value: '16', label: '16 opakování' },
  { value: '20', label: '20 opakování' },
]

export function RecurringSessionForm({ clients, onSuccess, onDirtyChange }: RecurringSessionFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  const clientOptions = clients.map((c) => ({ value: c.id, label: c.name }))

  useEffect(() => {
    setIsDirty(false)
    onDirtyChange?.(false)
  }, [onDirtyChange])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const form = new FormData(e.currentTarget)
      await createRecurringSessions({
        clientId: form.get('client_id') as string,
        dayOfWeek: parseInt(form.get('day_of_week') as string),
        time: form.get('time') as string,
        intervalWeeks: parseInt(form.get('interval_weeks') as string),
        count: parseInt(form.get('count') as string),
        location: (form.get('location') as string) || undefined,
        notes: (form.get('notes') as string) || undefined,
        startDate: form.get('start_date') as string,
      })
      hapticSuccess()
      setIsDirty(false)
      onDirtyChange?.(false)
      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/calendar')
      }
    } catch (err) {
      console.error('Recurring session creation error:', err)
      setError(err instanceof Error ? err.message : 'Nepodařilo se vytvořit opakované tréninky')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      onChange={() => {
        if (!isDirty) {
          setIsDirty(true)
          onDirtyChange?.(true)
        }
      }}
      className="space-y-4"
    >
      <Select
        id="client_id"
        name="client_id"
        label="Klient"
        options={clientOptions}
        placeholder="Vyberte klienta"
        required
      />

      <Select
        id="day_of_week"
        name="day_of_week"
        label="Den v týdnu"
        options={DAY_OPTIONS}
        required
      />

      <Input
        id="time"
        name="time"
        label="Čas"
        type="time"
        required
        defaultValue="10:00"
      />

      <Input
        id="start_date"
        name="start_date"
        label="Začátek od"
        type="date"
        required
        defaultValue={format(toPragueDate(new Date()), 'yyyy-MM-dd')}
      />

      <Select
        id="interval_weeks"
        name="interval_weeks"
        label="Opakování"
        options={INTERVAL_OPTIONS}
        required
      />

      <Select
        id="count"
        name="count"
        label="Počet opakování"
        options={COUNT_OPTIONS}
        required
      />

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
        Vytvořit opakované tréninky
      </Button>
    </form>
  )
}
