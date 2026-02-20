'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { updateTrainerProfile } from '@/lib/actions/settings'
import type { Trainer } from '@/types'

interface ProfileFormProps {
  trainer: Trainer
}

export function ProfileForm({ trainer }: ProfileFormProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)
    setError('')

    const formData = new FormData(e.currentTarget)
    try {
      await updateTrainerProfile(formData)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError('Nepodařilo se uložit profil')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        id="name"
        name="name"
        label="Jméno"
        defaultValue={trainer.name}
      />
      <Input
        id="email"
        name="email"
        label="Email"
        type="email"
        defaultValue={trainer.email}
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      {success && <p className="text-sm text-success">Profil byl uložen</p>}
      <Button type="submit" loading={loading}>
        Uložit profil
      </Button>
    </form>
  )
}
