import { AppShell } from '@/components/layout/app-shell'
import { PageHeader } from '@/components/ui/page-header'
import { TemplateForm } from '@/components/templates/template-form'
import { getTemplate } from '@/lib/actions/templates'
import { notFound } from 'next/navigation'

export default async function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let template
  try {
    template = await getTemplate(id)
  } catch {
    notFound()
  }

  return (
    <AppShell>
      <PageHeader title="Upravit šablonu" backHref="/templates" />
      <TemplateForm template={template} />
    </AppShell>
  )
}
