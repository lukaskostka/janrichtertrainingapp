import { AppShell } from '@/components/layout/app-shell'
import { PageHeader } from '@/components/ui/page-header'
import { TemplateForm } from '@/components/templates/template-form'

export default function NewTemplatePage() {
  return (
    <AppShell>
      <PageHeader title="Nová šablona" backHref="/templates" />
      <TemplateForm />
    </AppShell>
  )
}
