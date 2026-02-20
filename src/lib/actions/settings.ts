'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getTrainerProfile(): Promise<import('@/types').Trainer> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Neautorizovaný přístup')

  const { data, error } = await supabase
    .from('trainers')
    .select('*')
    .eq('id', user.id)
    .single()
  if (error) throw error
  return data as import('@/types').Trainer
}

export async function updateTrainerProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Neautorizovaný přístup')

  const { error } = await supabase.from('trainers').update({
    name: formData.get('name') as string,
    email: formData.get('email') as string,
  }).eq('id', user.id)
  if (error) throw error
  revalidatePath('/settings')
}
