'use server'

import { createAuthenticatedClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { addWeeks, setDay, format, startOfDay } from 'date-fns'
import { z } from 'zod'
import { toPragueDate, toUtcIsoFromLocalInput } from '@/lib/datetime'

const recurringSessionSchema = z.object({
  clientId: z.string().uuid(),
  dayOfWeek: z.number().int().min(0).max(6),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Čas musí být ve formátu HH:mm'),
  intervalWeeks: z.number().int().min(1).max(52),
  count: z.number().int().min(1).max(104),
  notes: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Datum musí být ve formátu YYYY-MM-DD'),
})

type RecurringSessionParams = z.infer<typeof recurringSessionSchema>

export async function createRecurringSessions(params: RecurringSessionParams) {
  const validated = recurringSessionSchema.parse(params)
  const { supabase, user } = await createAuthenticatedClient()

  // Get active package for client
  const { data: activePackage } = await supabase
    .from('packages')
    .select('id, total_sessions, used_sessions')
    .eq('client_id', validated.clientId)
    .eq('status', 'active')
    .single()

  let remainingInPackage = activePackage
    ? activePackage.total_sessions - activePackage.used_sessions
    : 0

  const recurrenceGroupId = crypto.randomUUID()
  const recurrenceRule = {
    day_of_week: validated.dayOfWeek,
    time: validated.time,
    interval_weeks: validated.intervalWeeks,
  }

  // Calculate dates
  const startDate = toPragueDate(`${validated.startDate}T00:00`)
  // Find first occurrence of the selected day on or after start date
  let firstDate = setDay(startDate, validated.dayOfWeek, { weekStartsOn: 1 })
  if (firstDate < startOfDay(startDate)) {
    firstDate = addWeeks(firstDate, 1)
  }

  const sessions = []
  for (let i = 0; i < validated.count; i++) {
    const date = addWeeks(firstDate, i * validated.intervalWeeks)
    const localDateTime = `${format(date, 'yyyy-MM-dd')}T${validated.time}`
    const scheduledAt = toUtcIsoFromLocalInput(localDateTime)

    sessions.push({
      trainer_id: user.id,
      client_id: validated.clientId,
      package_id: (activePackage && remainingInPackage > 0) ? activePackage.id : null,
      scheduled_at: scheduledAt,
      notes: validated.notes || null,
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
