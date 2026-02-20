'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Phone, Calendar, FileText, Pencil, Plus, Package as PackageIcon, Activity, Trash2 } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { PageHeader } from '@/components/ui/page-header'
import { Tabs } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Loading } from '@/components/ui/loading'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { PackageCard } from '@/components/clients/package-card'
import { SessionHistoryList } from '@/components/clients/session-history-list'
import { InBodyChart } from '@/components/clients/inbody-chart'
import { InBodyPhotos } from '@/components/clients/inbody-photos'
import { deleteInBodyRecord } from '@/lib/actions/inbody'
import { CLIENT_STATUS_LABELS } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { Client, Package as PackageType, InBodyRecord } from '@/types'

const TABS = [
  { id: 'overview', label: 'Přehled' },
  { id: 'packages', label: 'Balíčky' },
  { id: 'sessions', label: 'Tréninky' },
  { id: 'inbody', label: 'InBody' },
]

const statusVariant: Record<string, 'success' | 'warning' | 'default'> = {
  active: 'success',
  inactive: 'warning',
  archived: 'default',
}

export default function ClientProfilePage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string

  const [client, setClient] = useState<Client | null>(null)
  const [packages, setPackages] = useState<PackageType[]>([])
  const [inbodyRecords, setInbodyRecords] = useState<InBodyRecord[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()

    Promise.all([
      supabase.from('clients').select('*').eq('id', clientId).single(),
      supabase.from('packages').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
      supabase.from('inbody_records').select('*').eq('client_id', clientId).order('measured_at', { ascending: false }),
    ]).then(([clientRes, packagesRes, inbodyRes]) => {
      if (cancelled) return
      if (clientRes.error) {
        router.push('/clients')
        return
      }
      setClient(clientRes.data)
      setPackages(packagesRes.data ?? [])
      setInbodyRecords(inbodyRes.data ?? [])
      setLoading(false)
    })

    return () => { cancelled = true }
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
      <PageHeader
        title={client.name}
        backHref="/clients"
        rightAction={
          <Badge variant={statusVariant[client.status] ?? 'default'}>
            {CLIENT_STATUS_LABELS[client.status]}
          </Badge>
        }
      />

      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      <div className="px-4 pt-4">
        {activeTab === 'overview' && (
          <OverviewTab client={client} />
        )}
        {activeTab === 'packages' && (
          <PackagesTab clientId={clientId} packages={packages} />
        )}
        {activeTab === 'sessions' && (
          <SessionsTab clientId={clientId} />
        )}
        {activeTab === 'inbody' && (
          <InBodyTab clientId={clientId} records={inbodyRecords} />
        )}
      </div>
    </AppShell>
  )
}

function OverviewTab({ client }: { client: Client }) {
  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="space-y-3 py-4">
          {client.email && (
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-text-secondary" strokeWidth={1.5} />
              <span className="text-sm text-text-secondary">{client.email}</span>
            </div>
          )}
          {client.phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-text-secondary" strokeWidth={1.5} />
              <span className="text-sm text-text-secondary">{client.phone}</span>
            </div>
          )}
          {client.birth_date && (
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-text-secondary" strokeWidth={1.5} />
              <span className="text-sm text-text-secondary">{formatDate(client.birth_date)}</span>
            </div>
          )}
          {client.notes && (
            <div className="flex items-start gap-3">
              <FileText className="mt-0.5 h-4 w-4 text-text-secondary" strokeWidth={1.5} />
              <span className="text-sm text-text-secondary">{client.notes}</span>
            </div>
          )}
          {!client.email && !client.phone && !client.birth_date && !client.notes && (
            <p className="text-sm text-text-tertiary">Žádné další informace.</p>
          )}
        </CardContent>
      </Card>

      <Link href={`/clients/${client.id}/edit`}>
        <Button variant="secondary" className="w-full">
          <Pencil className="mr-2 h-4 w-4" strokeWidth={1.5} />
          Upravit klienta
        </Button>
      </Link>
    </div>
  )
}

function PackagesTab({ clientId, packages }: { clientId: string; packages: PackageType[] }) {
  const hasActivePackage = packages.some((p) => p.status === 'active')

  return (
    <div className="space-y-3">
      {hasActivePackage ? (
        <div className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          Klient již má aktivní balíček. Nový lze vytvořit až po jeho dokončení.
        </div>
      ) : (
        <Link href={`/clients/${clientId}/packages/new`}>
          <Button variant="secondary" className="w-full">
            <Plus className="mr-2 h-4 w-4" strokeWidth={1.5} />
            Nový balíček
          </Button>
        </Link>
      )}

      {packages.length === 0 ? (
        <EmptyState
          icon={PackageIcon}
          title="Žádné balíčky"
          description="Tento klient nemá žádné tréninkové balíčky."
        />
      ) : (
        packages.map((pkg) => (
          <PackageCard key={pkg.id} pkg={pkg} />
        ))
      )}
    </div>
  )
}

function SessionsTab({ clientId }: { clientId: string }) {
  return <SessionHistoryList clientId={clientId} />
}

function InBodyTab({ clientId, records }: { clientId: string; records: InBodyRecord[] }) {
  const router = useRouter()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      await deleteInBodyRecord(deleteId, clientId)
      setDeleteId(null)
      router.refresh()
    } catch (err) {
      console.error('Chyba při mazání:', err)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-3">
      <Link href={`/clients/${clientId}/inbody/new`}>
        <Button variant="secondary" className="w-full">
          <Plus className="mr-2 h-4 w-4" strokeWidth={1.5} />
          Nové měření
        </Button>
      </Link>

      {records.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="Žádná měření"
          description="Tento klient zatím nemá žádná InBody měření."
        />
      ) : (
        <>
          <InBodyChart records={records} />

          {records.map((record) => (
            <Card key={record.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-text-primary">{formatDate(record.measured_at)}</span>
                  <div className="flex items-center gap-1">
                    <Link href={`/clients/${clientId}/inbody/${record.id}/edit`} aria-label="Upravit měření">
                      <Pencil className="h-4 w-4 text-text-secondary" strokeWidth={1.5} />
                    </Link>
                    <button
                      onClick={() => setDeleteId(record.id)}
                      aria-label="Smazat měření"
                      className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-text-tertiary transition-colors hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  {record.weight != null && (
                    <div>
                      <span className="text-text-tertiary">Váha:</span>{' '}
                      <span className="text-text-secondary">{record.weight} kg</span>
                    </div>
                  )}
                  {record.body_fat_pct != null && (
                    <div>
                      <span className="text-text-tertiary">Tuk:</span>{' '}
                      <span className="text-text-secondary">{record.body_fat_pct}%</span>
                    </div>
                  )}
                  {record.muscle_mass != null && (
                    <div>
                      <span className="text-text-tertiary">Svaly:</span>{' '}
                      <span className="text-text-secondary">{record.muscle_mass} kg</span>
                    </div>
                  )}
                  {record.bmi != null && (
                    <div>
                      <span className="text-text-tertiary">BMI:</span>{' '}
                      <span className="text-text-secondary">{record.bmi}</span>
                    </div>
                  )}
                  {record.visceral_fat != null && (
                    <div>
                      <span className="text-text-tertiary">Visc. tuk:</span>{' '}
                      <span className="text-text-secondary">{record.visceral_fat}</span>
                    </div>
                  )}
                  {record.body_water_pct != null && (
                    <div>
                      <span className="text-text-tertiary">Voda:</span>{' '}
                      <span className="text-text-secondary">{record.body_water_pct}%</span>
                    </div>
                  )}
                </div>
                {record.photo_urls && record.photo_urls.length > 0 && (
                  <InBodyPhotos paths={record.photo_urls} />
                )}
                {record.notes && (
                  <p className="mt-2 text-sm text-text-secondary">{record.notes}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Smazat měření?"
        description="Tato akce smaže měření včetně všech fotek. Nelze ji vrátit zpět."
        confirmLabel="Smazat"
        variant="danger"
        loading={deleting}
      />
    </div>
  )
}
