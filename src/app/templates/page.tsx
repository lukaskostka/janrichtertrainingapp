import Link from 'next/link'
import { Plus, LayoutList } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { TemplateCard } from '@/components/templates/template-card'
import { getTemplates } from '@/lib/actions/templates'

export default async function TemplatesPage() {
  const templates = await getTemplates()

  return (
    <AppShell>
      <PageHeader
        title="Šablony tréninků"
        rightAction={
          <Link href="/templates/new">
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" strokeWidth={1.5} />
              Nová
            </Button>
          </Link>
        }
      />

      <PageTransition>
      <div className="px-4">
        {templates.length === 0 ? (
          <EmptyState
            icon={LayoutList}
            title="Žádné šablony"
            description="Vytvořte si šablonu tréninku pro rychlejší plánování."
            action={
              <Link href="/templates/new">
                <Button size="sm">Vytvořit šablonu</Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {templates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        )}
      </div>
      </PageTransition>
    </AppShell>
  )
}
