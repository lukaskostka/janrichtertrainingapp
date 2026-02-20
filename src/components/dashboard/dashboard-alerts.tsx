'use client'

import Link from 'next/link'
import { AlertTriangle, Ruler } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { StaggerList, StaggerItem } from '@/components/ui/motion'
import { formatDate } from '@/lib/utils'
import type { DashboardAlert } from '@/lib/actions/dashboard'

interface DashboardAlertsProps {
  alerts: DashboardAlert[]
}

export function DashboardAlerts({ alerts }: DashboardAlertsProps) {
  if (alerts.length === 0) return null

  return (
    <StaggerList className="space-y-2">
      {alerts.map((alert, index) => (
        <StaggerItem key={`${alert.type}-${alert.clientId}-${index}`}>
        <Link href={`/clients/${alert.clientId}`}>
          <Card className="flex items-start gap-3 p-4 transition-colors hover:bg-elevated">
            <div
              className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${
                alert.type === 'last_session'
                  ? 'bg-warning/20'
                  : 'bg-blue-500/20'
              }`}
            >
              {alert.type === 'last_session' ? (
                <AlertTriangle className="h-4 w-4 text-warning" strokeWidth={1.5} />
              ) : (
                <Ruler className="h-4 w-4 text-blue-400" strokeWidth={1.5} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary">
                {alert.type === 'last_session'
                  ? `Poslední trénink v balíčku`
                  : `InBody měření`}
              </p>
              <p className="mt-0.5 text-xs text-text-secondary">
                {alert.clientName} &middot; {alert.packageName} &middot; {formatDate(alert.sessionDate)}
              </p>
            </div>
          </Card>
        </Link>
        </StaggerItem>
      ))}
    </StaggerList>
  )
}
