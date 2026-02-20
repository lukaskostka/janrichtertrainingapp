import { AppShell } from '@/components/layout/app-shell'
import { PageHeader } from '@/components/ui/page-header'
import { SessionForm } from '@/components/sessions/session-form'
import { getClients } from '@/lib/actions/clients'
import type { Client } from '@/types'

export default async function NewSessionPage() {
  const clients = await getClients(undefined, 'active') as Client[]

  const clientList = (clients || []).map((c) => ({ id: c.id, name: c.name }))

  return (
    <AppShell>
      <PageHeader title="Naplánovat trénink" backHref="/calendar" />
      <SessionForm clients={clientList} />
    </AppShell>
  )
}
