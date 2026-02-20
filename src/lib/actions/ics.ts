'use server'

import { createClient } from '@/lib/supabase/server'

export async function getIcsToken() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Neautorizovaný přístup')

  const { data, error } = await supabase
    .from('trainers')
    .select('ics_token')
    .eq('id', user.id)
    .single()
  if (error) throw error
  return data?.ics_token
}

export async function regenerateIcsToken() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Neautorizovaný přístup')

  const { data, error } = await supabase
    .from('trainers')
    .update({ ics_token: crypto.randomUUID() })
    .eq('id', user.id)
    .select('ics_token')
    .single()
  if (error) throw error
  return data?.ics_token
}
