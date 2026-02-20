'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProgressBar } from '@/components/ui/progress-bar'
import { ScaleTap } from '@/components/ui/motion'
import { CLIENT_STATUS_LABELS } from '@/lib/constants'
import type { Client, Package } from '@/types'

type ClientWithPackages = Client & {
  packages: Pick<Package, 'id' | 'name' | 'total_sessions' | 'used_sessions' | 'status'>[]
}

interface ClientCardProps {
  client: ClientWithPackages
}

const statusVariant: Record<string, 'success' | 'warning' | 'default'> = {
  active: 'success',
  inactive: 'warning',
  archived: 'default',
}

export function ClientCard({ client }: ClientCardProps) {
  const activePackage = client.packages?.find((p) => p.status === 'active')
  const progress = activePackage
    ? Math.round((activePackage.used_sessions / activePackage.total_sessions) * 100)
    : null

  return (
    <ScaleTap>
      <Link href={`/clients/${client.id}`}>
        <Card className="transition-colors hover:border-border-hover">
          <CardContent className="flex items-center justify-between py-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-medium text-text-primary">{client.name}</h3>
                <Badge variant={statusVariant[client.status] ?? 'default'}>
                  {CLIENT_STATUS_LABELS[client.status]}
                </Badge>
              </div>
              {activePackage && (
                <div className="mt-2">
                  <ProgressBar
                    value={progress!}
                    label={`${activePackage.name} (${activePackage.used_sessions}/${activePackage.total_sessions})`}
                  />
                </div>
              )}
            </div>
            <ChevronRight className="ml-2 h-5 w-5 flex-shrink-0 text-text-tertiary" strokeWidth={1.5} />
          </CardContent>
        </Card>
      </Link>
    </ScaleTap>
  )
}
