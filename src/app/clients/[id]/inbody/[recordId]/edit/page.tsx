'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { PageHeader } from '@/components/ui/page-header'
import { InBodyForm } from '@/components/clients/inbody-form'
import { Loading } from '@/components/ui/loading'
import { getInBodyRecord, updateInBodyRecord } from '@/lib/actions/inbody'
import type { InBodyRecord } from '@/types'

export default function EditInBodyPage() {
  const params = useParams()
  const clientId = params.id as string
  const recordId = params.recordId as string

  const [record, setRecord] = useState<InBodyRecord | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getInBodyRecord(recordId)
      .then(setRecord)
      .finally(() => setLoading(false))
  }, [recordId])

  async function handleSubmit(formData: FormData) {
    await updateInBodyRecord(recordId, clientId, formData)
  }

  if (loading) {
    return (
      <AppShell>
        <Loading className="py-24" size="lg" />
      </AppShell>
    )
  }

  if (!record) {
    return (
      <AppShell>
        <PageHeader title="Záznam nenalezen" backHref={`/clients/${clientId}`} />
      </AppShell>
    )
  }

  return (
    <AppShell>
      <PageHeader title="Upravit InBody měření" backHref={`/clients/${clientId}`} />
      <InBodyForm clientId={clientId} record={record} onSubmit={handleSubmit} />
    </AppShell>
  )
}
