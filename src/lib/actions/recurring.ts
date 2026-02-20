'use server'

import { createAuthenticatedClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { addWeeks, setDay, format, startOfDay } from 'date-fns'
import { toPragueDate, toUtcIsoFromLocalInput } from '@/lib/datetime'

interface RecurringSessionParams {
  clientId: string
  dayOfWeek: number
  time: string
  intervalWeeks: number
  count: number
  location?: string
  notes?: string
  startDate: string
}

export async function createRecurringSessions(params: RecurringSessionParams) {
  const { supabase, user } = await createAuthenticatedClient()

  // Get active package for client
  const { data: activePackage } = await supabase
    .from('packages')
    .select('id, total_sessions, used_sessions')
    .eq('client_id', params.clientId)
    .eq('status', 'active')
    .single()

  let remainingInPackage = activePackage
    ? activePackage.total_sessions - activePackage.used_sessions
    : 0

  const recurrenceGroupId = crypto.randomUUID()
  const recurrenceRule = {
    day_of_week: params.dayOfWeek,
    time: params.time,
    interval_weeks: params.intervalWeeks,
  }

  // Calculate dates
  const startDate = toPragueDate(`${params.startDate}T00:00`)
  // Find first occurrence of the selected day on or after start date
  let firstDate = setDay(startDate, params.dayOfWeek, { weekStartsOn: 1 })
  if (firstDate < startOfDay(startDate)) {
    firstDate = addWeeks(firstDate, 1)
  }

  const sessions = []
  for (let i = 0; i < params.count; i++) {
    const date = addWeeks(firstDate, i * params.intervalWeeks)
    const localDateTime = `${format(date, 'yyyy-MM-dd')}T${params.time}`
    const scheduledAt = toUtcIsoFromLocalInput(localDateTime)

    sessions.push({
      trainer_id: user.id,
      client_id: params.clientId,
      package_id: (activePackage && remainingInPackage > 0) ? activePackage.id : null,
      scheduled_at: scheduledAt,
      location: params.location || null,
      notes: params.notes || null,
      recurrence_group_id: recurrenceGroupId,
      recurrence_rule: recurrenceRule,
    })

    if (activePackage && remainingInPackage > 0) {
      remainingInPackage--
    }
  }

  const { error } = await supabase.from('sessions').insert(sessions)
  if (error) {
    console.error('[recurring] Chyba při vytváření opakovaných tréninků:', error)
    throw new Error('Nepodařilo se vytvořit opakované tréninky')
  }

  revalidatePath('/calendar')
  revalidatePath('/clients')
  revalidatePath('/')
}
