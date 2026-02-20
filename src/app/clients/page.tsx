'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Plus, Users } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { SearchInput } from '@/components/ui/search-input'
import { EmptyState } from '@/components/ui/empty-state'
import { Loading } from '@/components/ui/loading'
import { Button } from '@/components/ui/button'
import { StaggerList, StaggerItem } from '@/components/ui/motion'
import { ClientCard } from '@/components/clients/client-card'
import { createClient } from '@/lib/supabase/client'
import type { Client, Package } from '@/types'

type ClientWithPackages = Client & {
  packages: Pick<Package, 'id' | 'name' | 'total_sessions' | 'used_sessions' | 'status'>[]
}

const STATUS_FILTERS = [
  { id: 'all', label: 'Vše' },
  { id: 'active', label: 'Aktivní' },
  { id: 'inactive', label: 'Neaktivní' },
  { id: 'archived', label: 'Archivovaní' },
]

export default function ClientsPageWrapper() {
  return (
    <Suspense fallback={<AppShell><Loading className="py-12" /></AppShell>}>
      <ClientsPage />
    </Suspense>
  )
}

function ClientsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [clients, setClients] = useState<ClientWithPackages[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const search = searchParams.get('search') ?? ''
  const status = searchParams.get('status') ?? 'all'
  const [inputValue, setInputValue] = useState(search)

  const loadClients = useCallback(async () => {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    let query = supabase
      .from('clients')
      .select('*, packages(id, name, total_sessions, used_sessions, status)')
      .order('name')

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }
    if (status && status !== 'all') {
      query = query.eq('status', status as 'active' | 'inactive' | 'archived')
    }

    try {
      const { data, error: queryError } = await query
      if (queryError) throw queryError
      setClients((data as ClientWithPackages[]) ?? [])
    } catch {
      setClients([])
      setError('Nepodařilo se načíst klienty.')
    } finally {
      setLoading(false)
    }
  }, [search, status])

  useEffect(() => {
    loadClients()
  }, [loadClients])

  // Debounce search input to URL param
  useEffect(() => {
    const timeout = setTimeout(() => {
      updateParams('search', inputValue)
    }, 300)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue])

  function updateParams(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.replace(`/clients?${params.toString()}`)
  }

  return (
    <AppShell>
      <PageHeader
        title="Klienti"
        rightAction={
          <Link href="/clients/new">
            <button className="rounded-lg p-2 text-text-secondary transition-colors hover:text-text-primary">
              <Plus className="h-5 w-5" strokeWidth={1.5} />
            </button>
          </Link>
        }
      />

      <PageTransition>
      {error && (
        <div className="px-4 pb-4">
          <div className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
            {error}
            <div className="mt-3">
              <Button size="sm" variant="secondary" onClick={loadClients}>
                Zkusit znovu
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="px-4 pb-4">
        <SearchInput
          placeholder="Hledat klienta..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
      </div>

      <div className="flex gap-2 px-4 pb-4">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => updateParams('status', f.id === 'all' ? '' : f.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              status === f.id || (f.id === 'all' && !status)
                ? 'bg-accent text-black'
                : 'bg-card text-text-secondary hover:bg-elevated'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="px-4">
        {loading ? (
          <Loading className="py-12" />
        ) : clients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Žádní klienti"
            description={search ? 'Žádný klient neodpovídá vašemu hledání.' : 'Zatím nemáte žádné klienty.'}
            action={
              !search ? (
                <Link href="/clients/new">
                  <Button>Přidat klienta</Button>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <StaggerList className="space-y-2">
            {clients.map((client) => (
              <StaggerItem key={client.id}>
                <ClientCard client={client} />
              </StaggerItem>
            ))}
          </StaggerList>
        )}
      </div>
      </PageTransition>
    </AppShell>
  )
}
