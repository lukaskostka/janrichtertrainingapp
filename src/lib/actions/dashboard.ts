'use server'

import { createAuthenticatedClient } from '@/lib/supabase/server'
import { startOfDay, endOfDay, startOfWeek, addDays } from 'date-fns'
import { toPragueDate, startOfDayUtc, endOfDayUtc, startOfWeekUtc, endOfWeekUtc, startOfMonthUtc, endOfMonthUtc } from '@/lib/datetime'
import type { Package, Client } from '@/types'

export type DashboardAlert = {
  type: 'last_session' | 'inbody_reminder'
  clientName: string
  clientId: string
  sessionDate: string
  packageName: string
}

export async function getDashboardData() {
  const { supabase } = await createAuthenticatedClient()
  const now = new Date()
  const todayStart = startOfDayUtc(now)
  const todayEnd = endOfDayUtc(now)
  const weekStart = startOfWeekUtc(now)
  const weekEnd = endOfWeekUtc(now)
  const monthStart = startOfMonthUtc(now)
  const monthEnd = endOfMonthUtc(now)

  // Today's sessions
  const { data: todaySessions } = await supabase
    .from('sessions')
    .select('*, clients(id, name)')
    .gte('scheduled_at', todayStart)
    .lte('scheduled_at', todayEnd)
    .order('scheduled_at')

  // This week's session count
  const { count: weekSessions } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .gte('scheduled_at', weekStart)
    .lte('scheduled_at', weekEnd)
    .in('status', ['scheduled', 'completed'])

  // Active clients count
  const { count: activeClients } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  // This month's income (from paid packages created this month)
  const { data: monthPackages } = await supabase
    .from('packages')
    .select('price')
    .eq('paid', true)
    .gte('paid_at', monthStart)
    .lte('paid_at', monthEnd)

  const monthIncome = monthPackages?.reduce((sum, p) => sum + (Number(p.price) || 0), 0) || 0

  // Week sessions by day (for weekly overview)
  const weekStartDate = startOfWeek(toPragueDate(now), { weekStartsOn: 1 })
  const { data: weekAllSessions } = await supabase
    .from('sessions')
    .select('scheduled_at')
    .gte('scheduled_at', weekStart)
    .lte('scheduled_at', weekEnd)
    .in('status', ['scheduled', 'completed'])

  const weekSessionsByDay = Array.from({ length: 7 }).map((_, i) => {
    const day = addDays(weekStartDate, i)
    const dayStart = startOfDay(day)
    const dayEnd = endOfDay(day)
    const count = (weekAllSessions || []).filter((s) => {
      const d = toPragueDate(s.scheduled_at)
      return d >= dayStart && d <= dayEnd
    }).length
    return { day: day.toISOString(), count }
  })

  // --- Alerts ---
  const alerts: DashboardAlert[] = []

  // Get this week's scheduled sessions with package + client info
  const { data: weekScheduledSessions } = await supabase
    .from('sessions')
    .select('*, clients(id, name), packages(id, name, total_sessions, used_sessions)')
    .gte('scheduled_at', weekStart)
    .lte('scheduled_at', weekEnd)
    .eq('status', 'scheduled')
    .not('package_id', 'is', null)
    .order('scheduled_at')

  if (weekScheduledSessions) {
    // Track which clients we've already alerted for each type
    const lastSessionAlerted = new Set<string>()
    const inbodyAlerted = new Set<string>()

    for (const session of weekScheduledSessions) {
      const pkg = session.packages as Pick<Package, 'id' | 'name' | 'total_sessions' | 'used_sessions'> | null
      const client = session.clients as Pick<Client, 'id' | 'name'> | null
      if (!pkg || !client) continue

      // Last session in package alert:
      // package.used_sessions + 1 = package.total_sessions
      if (
        !lastSessionAlerted.has(client.id) &&
        pkg.used_sessions + 1 >= pkg.total_sessions
      ) {
        lastSessionAlerted.add(client.id)
        alerts.push({
          type: 'last_session',
          clientName: client.name,
          clientId: client.id,
          sessionDate: session.scheduled_at,
          packageName: pkg.name,
        })
      }

      // InBody reminder: first session in a new package
      // (used_sessions === 0 means no sessions have been completed yet)
      if (
        !inbodyAlerted.has(client.id) &&
        pkg.used_sessions === 0
      ) {
        inbodyAlerted.add(client.id)
        alerts.push({
          type: 'inbody_reminder',
          clientName: client.name,
          clientId: client.id,
          sessionDate: session.scheduled_at,
          packageName: pkg.name,
        })
      }
    }
  }

  return {
    todaySessions: todaySessions || [],
    weekSessionsCount: weekSessions || 0,
    activeClientsCount: activeClients || 0,
    monthIncome,
    alerts,
    weekSessionsByDay,
  }
}
