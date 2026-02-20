'use server'

import { createAuthenticatedClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { TemplateExercise } from '@/types'

const templateExerciseSchema = z.array(z.object({
  exercise_id: z.string().uuid(),
  exercise_name: z.string().optional(),
  sets_config: z.array(z.object({
    reps: z.number().int().nonnegative(),
    weight: z.number().nonnegative(),
  })),
  order_index: z.number().int().nonnegative(),
  superset_group: z.number().int().nullable(),
}))

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
  const validatedExercises = templateExerciseSchema.parse(exercises)

  const { error } = await supabase.from('workout_templates').insert({
    trainer_id: user.id,
    name,
    category,
    exercises: validatedExercises,
  })
  if (error) throw error
  revalidatePath('/templates')
}

export async function updateTemplateAction(id: string, name: string, category: string | null, exercises: TemplateExercise[]) {
  const { supabase } = await createAuthenticatedClient()
  const validatedExercises = templateExerciseSchema.parse(exercises)
  const { error } = await supabase.from('workout_templates').update({
    name,
    category,
    exercises: validatedExercises,
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
