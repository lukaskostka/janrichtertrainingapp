'use server'

import { createAuthenticatedClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const createPackageSchema = z.object({
  name: z.string().min(1, 'Název je povinný'),
  total_sessions: z.coerce.number().int().positive('Musí být kladné číslo'),
  price: z.preprocess((v) => (v === '' || v === null ? null : v), z.coerce.number().nonnegative().nullable()),
})

export async function getPackages(clientId: string): Promise<import('@/types').Package[]> {
  const { supabase } = await createAuthenticatedClient()
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as import('@/types').Package[]
}

export async function getActivePackage(clientId: string): Promise<import('@/types').Package | null> {
  const { supabase } = await createAuthenticatedClient()
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .eq('client_id', clientId)
    .eq('status', 'active')
    .single()
  if (error && error.code !== 'PGRST116') throw error
  return (data as import('@/types').Package) ?? null
}

export async function createPackageAction(clientId: string, formData: FormData) {
  const { supabase } = await createAuthenticatedClient()

  const { data: existing } = await supabase
    .from('packages')
    .select('id')
    .eq('client_id', clientId)
    .eq('status', 'active')
    .single()

  if (existing) throw new Error('Klient již má aktivní balíček')

  const validated = createPackageSchema.parse({
    name: formData.get('name'),
    total_sessions: formData.get('total_sessions'),
    price: formData.get('price'),
  })

  const { error } = await supabase.from('packages').insert({
    client_id: clientId,
    ...validated,
  })
  if (error) throw error
  revalidatePath(`/clients/${clientId}`)
}

export async function updatePackage(packageId: string, clientId: string, updates: {
  name?: string
  total_sessions?: number
  used_sessions?: number
  price?: number | null
  status?: 'active' | 'completed' | 'expired'
}) {
  const { supabase } = await createAuthenticatedClient()

  if (updates.used_sessions !== undefined) {
    const { data: pkg } = await supabase
      .from('packages')
      .select('total_sessions')
      .eq('id', packageId)
      .single()
    if (pkg && (updates.used_sessions < 0 || updates.used_sessions > pkg.total_sessions)) {
      throw new Error('Počet využitých tréninků je mimo rozsah')
    }
  }
  if (updates.total_sessions !== undefined && updates.total_sessions < 1) {
    throw new Error('Celkový počet tréninků musí být alespoň 1')
  }

  // Auto-derive status based on used vs total sessions
  const { data: currentPkg } = await supabase.from('packages').select('total_sessions, used_sessions, status').eq('id', packageId).single()
  if (currentPkg) {
    const finalUsed = updates.used_sessions ?? currentPkg.used_sessions
    const finalTotal = updates.total_sessions ?? currentPkg.total_sessions
    if (finalUsed >= finalTotal) {
      updates.status = 'completed'
    } else if (updates.status === 'completed') {
      // Don't allow setting completed if sessions aren't used up
      updates.status = 'active'
    }
  }

  const { error } = await supabase.from('packages').update(updates).eq('id', packageId)
  if (error) throw error
  revalidatePath(`/clients/${clientId}`)
}

export async function togglePackagePayment(packageId: string, clientId: string) {
  const { supabase } = await createAuthenticatedClient()
  const { error } = await supabase.rpc('toggle_package_payment', { p_package_id: packageId })
  if (error) throw error
  revalidatePath(`/clients/${clientId}`)
}
