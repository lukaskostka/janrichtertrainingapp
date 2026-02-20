import Link from 'next/link'
import { Plus, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function QuickActions() {
  return (
    <div className="flex gap-3">
      <Link href="/sessions/new" className="flex-1">
        <Button variant="primary" className="w-full gap-2">
          <Plus className="h-4 w-4" strokeWidth={1.5} />
          Naplánovat trénink
        </Button>
      </Link>
      <Link href="/clients/new" className="flex-1">
        <Button variant="secondary" className="w-full gap-2">
          <UserPlus className="h-4 w-4" strokeWidth={1.5} />
          Přidat klienta
        </Button>
      </Link>
    </div>
  )
}
