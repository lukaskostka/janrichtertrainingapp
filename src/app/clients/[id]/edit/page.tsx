'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { PageHeader } from '@/components/ui/page-header'
import { Loading } from '@/components/ui/loading'
import { ClientForm } from '@/components/clients/client-form'
import { createClient } from '@/lib/supabase/client'
import type { Client } from '@/types'

export default function EditClientPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single()

      if (error) {
        router.push('/clients')
        return
      }

      setClient(data)
      setLoading(false)
    }
    load()
  }, [clientId, router])

  if (loading || !client) {
    return (
      <AppShell>
        <Loading className="py-24" size="lg" />
      </AppShell>
    )
  }

  return (
    <AppShell>
      <PageHeader title="Upravit klienta" backHref={`/clients/${clientId}`} />
      <ClientForm client={client} />
    </AppShell>
  )
}
