import { Dumbbell, Users, Wallet } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

interface QuickStatsProps {
  weekSessionsCount: number
  activeClientsCount: number
  monthIncome: number
}

export function QuickStats({ weekSessionsCount, activeClientsCount, monthIncome }: QuickStatsProps) {
  const stats = [
    {
      label: 'Tréninky tento týden',
      value: weekSessionsCount.toString(),
      icon: Dumbbell,
    },
    {
      label: 'Aktivní klienti',
      value: activeClientsCount.toString(),
      icon: Users,
    },
    {
      label: 'Příjem tento měsíc',
      value: formatCurrency(monthIncome),
      icon: Wallet,
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="p-3">
          <stat.icon className="mb-2 h-5 w-5 text-text-tertiary" strokeWidth={1.5} />
          <p className="text-lg font-bold text-text-primary">{stat.value}</p>
          <p className="text-xs text-text-tertiary">{stat.label}</p>
        </Card>
      ))}
    </div>
  )
}
