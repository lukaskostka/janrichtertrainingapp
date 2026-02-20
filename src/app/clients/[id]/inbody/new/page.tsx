import { AppShell } from '@/components/layout/app-shell'
import { PageHeader } from '@/components/ui/page-header'
import { InBodyForm } from '@/components/clients/inbody-form'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function NewInBodyPage({ params }: PageProps) {
  const { id } = await params

  return (
    <AppShell>
      <PageHeader title="Nové InBody měření" backHref={`/clients/${id}`} />
      <InBodyForm clientId={id} />
    </AppShell>
  )
}
