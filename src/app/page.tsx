import { CalendarOff } from 'lucide-react'
import { format } from 'date-fns'
import { cs } from 'date-fns/locale'
import { AppShell } from '@/components/layout/app-shell'
import { PageTransition } from '@/components/ui/page-transition'
import { EmptyState } from '@/components/ui/empty-state'
import { TodaySessions } from '@/components/dashboard/today-sessions'
import { QuickStats } from '@/components/dashboard/quick-stats'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { DashboardAlerts } from '@/components/dashboard/dashboard-alerts'
import { WeeklyOverview } from '@/components/dashboard/weekly-overview'
import { getDashboardData } from '@/lib/actions/dashboard'
import { toPragueDate } from '@/lib/datetime'

export default async function DashboardPage() {
  const data = await getDashboardData()
  const now = toPragueDate(new Date())
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Dobré ráno' : hour < 18 ? 'Dobré odpoledne' : 'Dobrý večer'
  const formattedDate = format(now, 'EEEE, d. MMMM', { locale: cs })
  // Capitalize first letter
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)

  return (
    <AppShell>
      <PageTransition>
      <div className="space-y-6 px-4 pb-6">
        {/* Header with greeting and date */}
        <div className="flex items-baseline justify-between pt-4">
          <h1 className="font-heading text-xl font-bold text-text-primary">
            {greeting}
          </h1>
          <p className="text-sm text-text-secondary">
            {capitalizedDate}
          </p>
        </div>

        {/* Weekly Overview */}
        <WeeklyOverview weekSessionsByDay={data.weekSessionsByDay} />

        {/* Alerts */}
        {data.alerts.length > 0 && (
          <section>
            <DashboardAlerts alerts={data.alerts} />
          </section>
        )}

        {/* Today's Sessions */}
        <section>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-text-tertiary">
            Dnešní tréninky
          </h2>
          {data.todaySessions.length > 0 ? (
            <TodaySessions sessions={data.todaySessions} />
          ) : (
            <EmptyState
              icon={CalendarOff}
              title="Žádné tréninky dnes"
              description="Na dnešek nemáte naplánované žádné tréninky."
            />
          )}
        </section>

        {/* Quick Stats */}
        <section>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-text-tertiary">
            Přehled
          </h2>
          <QuickStats
            weekSessionsCount={data.weekSessionsCount}
            activeClientsCount={data.activeClientsCount}
            monthIncome={data.monthIncome}
          />
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-text-tertiary">
            Rychlé akce
          </h2>
          <QuickActions />
        </section>
      </div>
      </PageTransition>
    </AppShell>
  )
}
