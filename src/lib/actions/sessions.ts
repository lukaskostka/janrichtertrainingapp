'use server'

import { createClient, createAuthenticatedClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { ensureUtcIso } from '@/lib/datetime'
import type { SessionWithClient, SessionWithDetails } from '@/types'

const createSessionSchema = z.object({
  client_id: z.string().uuid(),
  scheduled_at: z.string().min(1),
  location: z.preprocess((v) => (v === '' ? null : v), z.string().nullable()),
  notes: z.preprocess((v) => (v === '' ? null : v), z.string().nullable()),
})

let lastAutoComplete = 0

export async function getSessions(filters?: { from?: string; to?: string; clientId?: string; status?: string }): Promise<SessionWithClient[]> {
  const { supabase } = await createAuthenticatedClient()
  let query = supabase.from('sessions').select('*, clients(id, name)').order('scheduled_at', { ascending: true })

  if (filters?.from) query = query.gte('scheduled_at', filters.from)
  if (filters?.to) query = query.lte('scheduled_at', filters.to)
  if (filters?.clientId) query = query.eq('client_id', filters.clientId)
  if (filters?.status) query = query.eq('status', filters.status as 'scheduled' | 'completed' | 'cancelled' | 'no_show')

  const { data, error } = await query
  if (error) throw error
  return data as SessionWithClient[]
}

export async function getSession(id: string): Promise<SessionWithDetails> {
  const { supabase } = await createAuthenticatedClient()
  const { data, error } = await supabase
    .from('sessions')
    .select('*, clients(id, name), packages(id, name, total_sessions, used_sessions)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as SessionWithDetails
}

export async function createSessionAction(formData: FormData) {
  const { supabase, user } = await createAuthenticatedClient()

  const validated = createSessionSchema.parse({
    client_id: formData.get('client_id'),
    scheduled_at: formData.get('scheduled_at'),
    location: formData.get('location'),
    notes: formData.get('notes'),
  })

  // Auto-assign active package
  const { data: activePackage } = await supabase
    .from('packages')
    .select('id')
    .eq('client_id', validated.client_id)
    .eq('status', 'active')
    .single()

  const scheduledAt = validated.scheduled_at ? ensureUtcIso(validated.scheduled_at) : validated.scheduled_at

  const { error } = await supabase.from('sessions').insert({
    trainer_id: user.id,
    client_id: validated.client_id,
    package_id: activePackage?.id || null,
    scheduled_at: scheduledAt,
    location: validated.location,
    notes: validated.notes,
  })
  if (error) throw error
  revalidatePath('/calendar')
  revalidatePath('/clients')
}

export async function createSessionDirect(data: {
  client_id: string
  scheduled_at: string
  location?: string
  notes?: string
}) {
  const { supabase, user } = await createAuthenticatedClient()

  const { data: activePackage } = await supabase
    .from('packages')
    .select('id')
    .eq('client_id', data.client_id)
    .eq('status', 'active')
    .single()

  const scheduledAt = data.scheduled_at ? ensureUtcIso(data.scheduled_at) : data.scheduled_at

  const { data: session, error } = await supabase.from('sessions').insert({
    trainer_id: user.id,
    client_id: data.client_id,
    package_id: activePackage?.id || null,
    scheduled_at: scheduledAt,
    location: data.location || null,
    notes: data.notes || null,
  }).select().single()
  if (error) throw error
  revalidatePath('/calendar')
  revalidatePath('/clients')
  return session
}

export async function updateSession(id: string, updates: {
  scheduled_at?: string
  location?: string | null
  notes?: string | null
}) {
  const { supabase } = await createAuthenticatedClient()
  const scheduledAt = updates.scheduled_at ? ensureUtcIso(updates.scheduled_at) : updates.scheduled_at
  const payload = {
    ...updates,
    ...(scheduledAt ? { scheduled_at: scheduledAt } : {}),
  }
  const { error } = await supabase.from('sessions').update(payload).eq('id', id)
  if (error) throw error
  revalidatePath(`/sessions/${id}`)
  revalidatePath('/calendar')
  revalidatePath('/clients')
}

export async function updateSessionStatus(id: string, status: 'scheduled' | 'completed' | 'cancelled' | 'no_show') {
  const { supabase } = await createAuthenticatedClient()

  // If completing, also increment used_sessions on the package
  if (status === 'completed') {
    const { data: session } = await supabase
      .from('sessions')
      .select('package_id, status')
      .eq('id', id)
      .single()

    // Only increment if the session wasn't already completed
    if (session?.package_id && session.status !== 'completed') {
      const { error: rpcError } = await supabase.rpc('increment_package_sessions', { p_package_id: session.package_id })
      if (rpcError) throw new Error('Nelze aktualizovat balíček: ' + rpcError.message)
    }
  }

  const { error } = await supabase.from('sessions').update({ status }).eq('id', id)
  if (error) throw error
  revalidatePath(`/sessions/${id}`)
  revalidatePath('/calendar')
  revalidatePath('/clients')
  revalidatePath('/')
}

export async function deleteSession(id: string) {
  const { supabase } = await createAuthenticatedClient()

  // If the session was completed and had a package, decrement used_sessions
  const { data: session } = await supabase
    .from('sessions')
    .select('status, package_id')
    .eq('id', id)
    .single()

  if (session?.status === 'completed' && session.package_id) {
    const { data: rpcResult, error: rpcError } = await supabase.rpc('decrement_package_sessions', { p_package_id: session.package_id })
    if (rpcError) {
      console.error(`[deleteSession] Chyba při dekrementaci balíčku ${session.package_id}:`, rpcError.message)
      throw new Error('Nelze aktualizovat balíček: ' + rpcError.message)
    }
    if (!rpcResult || (Array.isArray(rpcResult) && rpcResult.length === 0)) {
      throw new Error('Nelze aktualizovat balíček: balíček nebyl nalezen')
    }
  }

  // Delete session exercises then the session
  const { error: exercisesError } = await supabase.from('session_exercises').delete().eq('session_id', id)
  if (exercisesError) {
    console.error(`[deleteSession] Chyba při mazání cviků relace ${id}:`, exercisesError.message)
    throw new Error('Nelze smazat cviky relace: ' + exercisesError.message)
  }
  const { error } = await supabase.from('sessions').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/calendar')
  revalidatePath('/clients')
  revalidatePath('/')
}

export async function deleteFutureRecurringSessions(recurrenceGroupId: string, afterDate: string) {
  const { supabase } = await createAuthenticatedClient()
  // Get sessions to delete
  const { data: sessions } = await supabase
    .from('sessions')
    .select('id')
    .eq('recurrence_group_id', recurrenceGroupId)
    .gt('scheduled_at', afterDate)
    .eq('status', 'scheduled')

  if (sessions) {
    for (const s of sessions) {
      await supabase.from('session_exercises').delete().eq('session_id', s.id)
      await supabase.from('sessions').delete().eq('id', s.id)
    }
  }
  revalidatePath('/calendar')
  revalidatePath('/clients')
}

export async function getClientSessions(clientId: string): Promise<import('@/types').Session[]> {
  const { supabase } = await createAuthenticatedClient()
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('client_id', clientId)
    .order('scheduled_at', { ascending: false })
  if (error) throw error
  return data as import('@/types').Session[]
}

export async function autoCompleteExpiredSessions() {
  if (Date.now() - lastAutoComplete < 60_000) return
  lastAutoComplete = Date.now()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString() // 60 min ago

  const { data: expired } = await supabase
    .from('sessions')
    .select('id, package_id')
    .eq('trainer_id', user.id)
    .eq('status', 'scheduled')
    .lt('scheduled_at', cutoff)

  if (!expired || expired.length === 0) return

  for (const session of expired) {
    // Complete session with optimistic lock to prevent double-completion
    const { data: updated, error: updateError } = await supabase
      .from('sessions')
      .update({ status: 'completed' })
      .eq('id', session.id)
      .eq('status', 'scheduled')
      .select('id')
      .single()

    if (updateError || !updated) continue

    // Only increment if the update succeeded (session was still scheduled)
    if (session.package_id) {
      const { error: rpcError } = await supabase.rpc('increment_package_sessions', { p_package_id: session.package_id })
      if (rpcError) {
        console.error(`[autoComplete] Chyba při aktualizaci balíčku ${session.package_id}:`, rpcError.message)
      }
    }
  }

  revalidatePath('/')
  revalidatePath('/calendar')
  revalidatePath('/clients')
}
