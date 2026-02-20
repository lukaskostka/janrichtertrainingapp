import { AppShell } from '@/components/layout/app-shell'
import { PageHeader } from '@/components/ui/page-header'
import { PackageForm } from '@/components/clients/package-form'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function NewPackagePage({ params }: PageProps) {
  const { id } = await params

  return (
    <AppShell>
      <PageHeader title="Nový balíček" backHref={`/clients/${id}`} />
      <PackageForm clientId={id} />
    </AppShell>
  )
}
