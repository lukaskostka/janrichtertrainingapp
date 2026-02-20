'use server'

import { createAuthenticatedClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const exerciseSchema = z.object({
  name: z.string().min(1, 'Název cviku je povinný').max(200),
})

export async function getExercises(search?: string): Promise<import('@/types').Exercise[]> {
  const { supabase } = await createAuthenticatedClient()
  let query = supabase.from('exercises').select('*').order('name')
  if (search) {
    query = query.ilike('name', `%${search}%`)
  }
  const { data, error } = await query
  if (error) throw error
  return data as import('@/types').Exercise[]
}

export async function createExerciseAction(formData: FormData) {
  const { supabase, user } = await createAuthenticatedClient()
  const validated = exerciseSchema.parse({ name: formData.get('name') })

  const { data, error } = await supabase.from('exercises').insert({
    trainer_id: user.id,
    name: validated.name,
  }).select().single()
  if (error) throw error
  revalidatePath('/exercises')
  return data as unknown as import('@/types').Exercise
}

export async function updateExerciseAction(id: string, formData: FormData) {
  const { supabase } = await createAuthenticatedClient()
  const validated = exerciseSchema.parse({ name: formData.get('name') })
  const { error } = await supabase.from('exercises').update({
    name: validated.name,
  }).eq('id', id)
  if (error) throw error
  revalidatePath('/exercises')
}

export async function deleteExerciseAction(id: string) {
  const { supabase } = await createAuthenticatedClient()
  const { error } = await supabase.from('exercises').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/exercises')
}
