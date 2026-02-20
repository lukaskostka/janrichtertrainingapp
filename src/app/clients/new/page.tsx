import { AppShell } from '@/components/layout/app-shell'
import { PageHeader } from '@/components/ui/page-header'
import { ClientForm } from '@/components/clients/client-form'

export default function NewClientPage() {
  return (
    <AppShell>
      <PageHeader title="Nový klient" backHref="/clients" />
      <ClientForm />
    </AppShell>
  )
}
