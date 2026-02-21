'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const trainerProfileSchema = z.object({
  name: z.string().min(1, 'Jméno je povinné').max(100),
  email: z.string().email('Neplatný formát e-mailu'),
})

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

export async function getGeminiStatus(): Promise<{ configured: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Neautorizovaný přístup')
  return { configured: !!process.env.GEMINI_API_KEY }
}

export async function updateTrainerProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Neautorizovaný přístup')

  const validated = trainerProfileSchema.parse({
    name: formData.get('name'),
    email: formData.get('email'),
  })

  const { error } = await supabase.from('trainers').update({
    name: validated.name,
    email: validated.email,
  }).eq('id', user.id)
  if (error) throw error
  revalidatePath('/settings')
}
