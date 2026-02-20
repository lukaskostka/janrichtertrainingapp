'use server'

import { createAuthenticatedClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { TemplateExercise } from '@/types'

export async function getTemplates(): Promise<import('@/types').WorkoutTemplate[]> {
  const { supabase } = await createAuthenticatedClient()
  const { data, error } = await supabase.from('workout_templates').select('*').order('name')
  if (error) throw error
  return data as import('@/types').WorkoutTemplate[]
}

export async function getTemplate(id: string): Promise<import('@/types').WorkoutTemplate> {
  const { supabase } = await createAuthenticatedClient()
  const { data, error } = await supabase.from('workout_templates').select('*').eq('id', id).single()
  if (error) throw error
  return data as import('@/types').WorkoutTemplate
}

export async function createTemplateAction(name: string, category: string | null, exercises: TemplateExercise[]) {
  const { supabase, user } = await createAuthenticatedClient()

  const { error } = await supabase.from('workout_templates').insert({
    trainer_id: user.id,
    name,
    category,
    exercises,
  })
  if (error) throw error
  revalidatePath('/templates')
}

export async function updateTemplateAction(id: string, name: string, category: string | null, exercises: TemplateExercise[]) {
  const { supabase } = await createAuthenticatedClient()
  const { error } = await supabase.from('workout_templates').update({
    name,
    category,
    exercises,
  }).eq('id', id)
  if (error) throw error
  revalidatePath('/templates')
}

export async function deleteTemplateAction(id: string) {
  const { supabase } = await createAuthenticatedClient()
  const { error } = await supabase.from('workout_templates').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/templates')
}
