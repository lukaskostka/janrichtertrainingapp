'use server'

import { createAuthenticatedClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { Client, Package, InBodyRecord } from '@/types'

type ClientWithPackages = Client & {
  packages: Pick<Package, 'id' | 'name' | 'total_sessions' | 'used_sessions' | 'status'>[]
}

const clientSchema = z.object({
  name: z.string().min(1, 'Jméno je povinné'),
  email: z.preprocess((v) => (v === '' ? null : v), z.string().email().nullable()),
  phone: z.preprocess((v) => (v === '' ? null : v), z.string().nullable()),
  birth_date: z.preprocess((v) => (v === '' ? null : v), z.string().nullable()),
  notes: z.preprocess((v) => (v === '' ? null : v), z.string().nullable()),
})

export async function getClients(search?: string, status?: string): Promise<ClientWithPackages[]> {
  const { supabase } = await createAuthenticatedClient()
  let query = supabase.from('clients').select('*, packages(id, name, total_sessions, used_sessions, status)').order('name')

  if (search) {
    query = query.ilike('name', `%${search}%`)
  }
  if (status && status !== 'all') {
    query = query.eq('status', status as 'active' | 'inactive' | 'archived')
  }

  const { data, error } = await query
  if (error) throw error
  return data as ClientWithPackages[]
}

export async function getClient(id: string): Promise<Client> {
  const { supabase } = await createAuthenticatedClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as Client
}

export async function getClientDetail(id: string): Promise<{
  client: Client
  packages: Package[]
  inbodyRecords: InBodyRecord[]
} | null> {
  const { supabase } = await createAuthenticatedClient()

  const [clientRes, packagesRes, inbodyRes] = await Promise.all([
    supabase.from('clients').select('*').eq('id', id).single(),
    supabase.from('packages').select('*').eq('client_id', id).order('created_at', { ascending: false }),
    supabase.from('inbody_records').select('*').eq('client_id', id).order('measured_at', { ascending: false }),
  ])

  if (clientRes.error) return null

  return {
    client: clientRes.data as Client,
    packages: (packagesRes.data as Package[]) ?? [],
    inbodyRecords: (inbodyRes.data as InBodyRecord[]) ?? [],
  }
}

export async function createClientAction(formData: FormData) {
  const { supabase, user } = await createAuthenticatedClient()

  const validated = clientSchema.parse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    birth_date: formData.get('birth_date'),
    notes: formData.get('notes'),
  })

  const { error } = await supabase.from('clients').insert({
    trainer_id: user.id,
    ...validated,
    status: 'active',
  })
  if (error) throw error
  revalidatePath('/clients')
}

export async function updateClientAction(id: string, formData: FormData) {
  const { supabase } = await createAuthenticatedClient()
  const validated = clientSchema.parse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    birth_date: formData.get('birth_date'),
    notes: formData.get('notes'),
  })
  const status = z.enum(['active', 'inactive', 'archived']).parse(formData.get('status'))

  const { error } = await supabase.from('clients').update({
    ...validated,
    status,
  }).eq('id', id)
  if (error) throw error
  revalidatePath(`/clients/${id}`)
  revalidatePath('/clients')
}
