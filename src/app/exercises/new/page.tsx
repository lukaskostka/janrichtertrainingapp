'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { PageHeader } from '@/components/ui/page-header'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createExerciseAction } from '@/lib/actions/exercises'

export default function NewExercisePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const name = (formData.get('name') as string).trim()

    if (!name) {
      setError('Název cviku je povinný')
      setLoading(false)
      return
    }

    try {
      await createExerciseAction(formData)
      router.push('/exercises')
    } catch {
      setError('Nepodařilo se vytvořit cvik')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell>
      <PageHeader title="Nový cvik" backHref="/exercises" />
      <form onSubmit={handleSubmit} className="space-y-6 px-4">
        <Input
          id="name"
          name="name"
          label="Název cviku"
          placeholder="např. Bench press"
          error={error}
          autoFocus
        />
        <Button type="submit" loading={loading} className="w-full">
          Vytvořit cvik
        </Button>
      </form>
    </AppShell>
  )
}
