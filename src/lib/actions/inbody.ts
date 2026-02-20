'use server'

import { createAuthenticatedClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getInBodyRecords(clientId: string): Promise<import('@/types').InBodyRecord[]> {
  const { supabase } = await createAuthenticatedClient()
  const { data, error } = await supabase
    .from('inbody_records')
    .select('*')
    .eq('client_id', clientId)
    .order('measured_at', { ascending: false })
  if (error) throw error
  return data as import('@/types').InBodyRecord[]
}

export async function getInBodyRecord(id: string): Promise<import('@/types').InBodyRecord> {
  const { supabase } = await createAuthenticatedClient()
  const { data, error } = await supabase
    .from('inbody_records')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as import('@/types').InBodyRecord
}

export async function createInBodyRecord(clientId: string, formData: FormData) {
  const { supabase } = await createAuthenticatedClient()

  const photoUrls: string[] = []
  const photos = formData.getAll('photos') as File[]
  for (const photo of photos) {
    if (photo.size === 0) continue
    const ext = photo.name.split('.').pop() ?? 'jpg'
    const path = `inbody/${clientId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('inbody-photos')
      .upload(path, photo)
    if (uploadError) throw new Error('Chyba při nahrávání fotky: ' + uploadError.message)
    photoUrls.push(path)
  }

  const { error } = await supabase.from('inbody_records').insert({
    client_id: clientId,
    measured_at: formData.get('measured_at') as string,
    weight: formData.get('weight') ? parseFloat(formData.get('weight') as string) : null,
    body_fat_pct: formData.get('body_fat_pct') ? parseFloat(formData.get('body_fat_pct') as string) : null,
    muscle_mass: formData.get('muscle_mass') ? parseFloat(formData.get('muscle_mass') as string) : null,
    bmi: formData.get('bmi') ? parseFloat(formData.get('bmi') as string) : null,
    visceral_fat: formData.get('visceral_fat') ? parseFloat(formData.get('visceral_fat') as string) : null,
    body_water_pct: formData.get('body_water_pct') ? parseFloat(formData.get('body_water_pct') as string) : null,
    notes: (formData.get('notes') as string) || null,
    photo_urls: photoUrls.length > 0 ? photoUrls : null,
  })
  if (error) throw error
  revalidatePath('/clients/' + clientId)
}

export async function updateInBodyRecord(id: string, clientId: string, formData: FormData) {
  const { supabase } = await createAuthenticatedClient()

  // Handle new photos
  const photoUrls: string[] = []
  const existingPhotos = formData.getAll('existing_photos') as string[]
  for (const path of existingPhotos) {
    if (path) photoUrls.push(path)
  }

  const photos = formData.getAll('photos') as File[]
  for (const photo of photos) {
    if (photo.size === 0) continue
    const ext = photo.name.split('.').pop() ?? 'jpg'
    const path = `inbody/${clientId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('inbody-photos')
      .upload(path, photo)
    if (uploadError) throw new Error('Chyba při nahrávání fotky: ' + uploadError.message)
    photoUrls.push(path)
  }

  const { error } = await supabase.from('inbody_records').update({
    measured_at: formData.get('measured_at') as string,
    weight: formData.get('weight') ? parseFloat(formData.get('weight') as string) : null,
    body_fat_pct: formData.get('body_fat_pct') ? parseFloat(formData.get('body_fat_pct') as string) : null,
    muscle_mass: formData.get('muscle_mass') ? parseFloat(formData.get('muscle_mass') as string) : null,
    bmi: formData.get('bmi') ? parseFloat(formData.get('bmi') as string) : null,
    visceral_fat: formData.get('visceral_fat') ? parseFloat(formData.get('visceral_fat') as string) : null,
    body_water_pct: formData.get('body_water_pct') ? parseFloat(formData.get('body_water_pct') as string) : null,
    notes: (formData.get('notes') as string) || null,
    photo_urls: photoUrls.length > 0 ? photoUrls : null,
  }).eq('id', id)
  if (error) throw error
  revalidatePath('/clients/' + clientId)
}

export async function deleteInBodyRecord(id: string, clientId: string) {
  const { supabase } = await createAuthenticatedClient()

  // Fetch record to get photo paths
  const { data: record, error: fetchError } = await supabase
    .from('inbody_records')
    .select('photo_urls')
    .eq('id', id)
    .single()

  if (fetchError) throw new Error('Záznam nebyl nalezen')

  // Delete photos from storage
  if (record.photo_urls && record.photo_urls.length > 0) {
    const { error: storageError } = await supabase.storage
      .from('inbody-photos')
      .remove(record.photo_urls)
    if (storageError) {
      console.error('Chyba při mazání fotek:', storageError.message)
    }
  }

  // Delete the record
  const { error } = await supabase
    .from('inbody_records')
    .delete()
    .eq('id', id)

  if (error) throw new Error('Nepodařilo se smazat záznam')

  revalidatePath('/clients/' + clientId)
}

export async function getInBodyPhotoUrl(path: string): Promise<string> {
  const { supabase } = await createAuthenticatedClient()
  const { data, error } = await supabase.storage
    .from('inbody-photos')
    .createSignedUrl(path, 3600)
  if (error) throw error
  return data.signedUrl
}

export async function getInBodyPhotoUrls(paths: string[]): Promise<string[]> {
  const { supabase } = await createAuthenticatedClient()
  const urls: string[] = []
  for (const path of paths) {
    const { data, error } = await supabase.storage
      .from('inbody-photos')
      .createSignedUrl(path, 3600)
    if (!error && data) urls.push(data.signedUrl)
  }
  return urls
}
