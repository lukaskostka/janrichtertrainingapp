'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProgressBar } from '@/components/ui/progress-bar'
import { Button } from '@/components/ui/button'
import { PACKAGE_STATUS_LABELS } from '@/lib/constants'
import { formatCurrency, formatDate } from '@/lib/utils'
import { togglePackagePayment } from '@/lib/actions/packages'
import { PackageEditSheet } from './package-edit-sheet'
import { Pencil } from 'lucide-react'
import type { Package } from '@/types'

interface PackageCardProps {
  pkg: Package
}

const statusVariant: Record<string, 'success' | 'warning' | 'default'> = {
  active: 'success',
  completed: 'default',
  expired: 'warning',
}

export function PackageCard({ pkg }: PackageCardProps) {
  const router = useRouter()
  const [toggling, setToggling] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [paid, setPaid] = useState(pkg.paid)
  const [paidAt, setPaidAt] = useState(pkg.paid_at)
  const progress = Math.round((pkg.used_sessions / pkg.total_sessions) * 100)

  async function handleTogglePayment() {
    setToggling(true)
    const prevPaid = paid
    const prevPaidAt = paidAt

    // Optimistic update
    const newPaid = !paid
    setPaid(newPaid)
    setPaidAt(newPaid ? new Date().toISOString() : null)

    try {
      await togglePackagePayment(pkg.id, pkg.client_id)
    } catch (err) {
      // Rollback on error
      setPaid(prevPaid)
      setPaidAt(prevPaidAt)
      console.error('Chyba při změně platby:', err)
    } finally {
      setToggling(false)
    }
  }

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="truncate font-medium text-text-primary">{pkg.name}</h4>
              <button
                onClick={() => setShowEdit(true)}
                aria-label="Upravit balíček"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-text-tertiary transition-colors hover:text-text-primary"
              >
                <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
              <Badge variant={statusVariant[pkg.status] ?? 'default'}>
                {PACKAGE_STATUS_LABELS[pkg.status]}
              </Badge>
              <Badge variant={paid ? 'success' : 'danger'}>
                {paid ? 'Zaplaceno' : 'Nezaplaceno'}
              </Badge>
            </div>
            <div className="mt-2">
              <ProgressBar
                value={progress}
                label={`${pkg.used_sessions} / ${pkg.total_sessions} tréninků`}
              />
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-sm">
          <div className="text-text-secondary">
            {pkg.price != null && (
              <span>
                {formatCurrency(pkg.price)}
                {' — '}
              </span>
            )}
            <span>{formatDate(pkg.created_at)}</span>
          </div>
          <div className="flex items-center gap-2">
            {paid && paidAt && (
              <span className="text-xs text-text-tertiary">{formatDate(paidAt)}</span>
            )}
            <Button
              variant="secondary"
              size="sm"
              loading={toggling}
              onClick={handleTogglePayment}
            >
              {paid ? 'Označit nezaplaceno' : 'Označit zaplaceno'}
            </Button>
          </div>
        </div>
      </CardContent>

      <PackageEditSheet
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        pkg={pkg}
        onSuccess={() => router.refresh()}
      />
    </Card>
  )
}
