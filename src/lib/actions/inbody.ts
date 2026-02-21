'use server'

import { createAuthenticatedClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { InBodyExtendedData, BodySegment, SegmentalEvaluation } from '@/types'

const MAX_PHOTO_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB
const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'])

function validatePhoto(photo: File) {
  if (photo.size > MAX_PHOTO_SIZE_BYTES) {
    throw new Error(`Fotka "${photo.name}" překračuje maximální velikost 10 MB`)
  }
  const ext = (photo.name.split('.').pop() ?? '').toLowerCase()
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new Error(`Nepodporovaný formát fotky "${photo.name}". Povolené: ${[...ALLOWED_EXTENSIONS].join(', ')}`)
  }
}

const SEGMENTS: BodySegment[] = ['right_arm', 'left_arm', 'trunk', 'right_leg', 'left_leg']

function parseOptionalFloat(val: FormDataEntryValue | null): number | null {
  if (!val || val === '') return null
  const n = parseFloat(val as string)
  return isNaN(n) ? null : n
}

function parseEvaluation(val: FormDataEntryValue | null): SegmentalEvaluation | null {
  if (!val || val === '') return null
  const s = val as string
  if (s === 'below' || s === 'normal' || s === 'above') return s
  return null
}

function parseExtendedData(formData: FormData): InBodyExtendedData | null {
  const ext: InBodyExtendedData = {
    fat_kg: parseOptionalFloat(formData.get('ext_fat_kg')),
    ffm_kg: parseOptionalFloat(formData.get('ext_ffm_kg')),
    tbw_liters: parseOptionalFloat(formData.get('ext_tbw_liters')),
    whr: parseOptionalFloat(formData.get('ext_whr')),
    bmr_kcal: parseOptionalFloat(formData.get('ext_bmr_kcal')),
    fitness_score: parseOptionalFloat(formData.get('ext_fitness_score')),
    gender: (formData.get('ext_gender') as string) || null,
    age: parseOptionalFloat(formData.get('ext_age')),
    height_cm: parseOptionalFloat(formData.get('ext_height_cm')),
  }

  // Parse segmental lean
  const segLean: Record<string, { mass_kg: number | null; evaluation: SegmentalEvaluation | null }> = {}
  let hasSegLean = false
  for (const seg of SEGMENTS) {
    const mass = parseOptionalFloat(formData.get(`seg_lean_${seg}_mass`))
    const evaluation = parseEvaluation(formData.get(`seg_lean_${seg}_eval`))
    if (mass != null || evaluation != null) hasSegLean = true
    segLean[seg] = { mass_kg: mass, evaluation }
  }
  if (hasSegLean) ext.segmental_lean = segLean as InBodyExtendedData['segmental_lean']

  // Parse segmental fat
  const segFat: Record<string, { mass_kg: number | null; evaluation: SegmentalEvaluation | null }> = {}
  let hasSegFat = false
  for (const seg of SEGMENTS) {
    const mass = parseOptionalFloat(formData.get(`seg_fat_${seg}_mass`))
    const evaluation = parseEvaluation(formData.get(`seg_fat_${seg}_eval`))
    if (mass != null || evaluation != null) hasSegFat = true
    segFat[seg] = { mass_kg: mass, evaluation }
  }
  if (hasSegFat) ext.segmental_fat = segFat as InBodyExtendedData['segmental_fat']

  // Parse muscle-fat control
  const muscleAdj = parseOptionalFloat(formData.get('ext_muscle_adjustment_kg'))
  const fatAdj = parseOptionalFloat(formData.get('ext_fat_adjustment_kg'))
  if (muscleAdj != null || fatAdj != null) {
    ext.muscle_fat_control = { muscle_adjustment_kg: muscleAdj, fat_adjustment_kg: fatAdj }
  }

  // Check if any extended data was actually provided
  const hasData = Object.values(ext).some((v) => v != null)
  return hasData ? ext : null
}

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
    validatePhoto(photo)
    const ext = (photo.name.split('.').pop() ?? 'jpg').toLowerCase()
    const path = `inbody/${clientId}/${Date.now()}-${crypto.randomUUID()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('inbody-photos')
      .upload(path, photo)
    if (uploadError) throw new Error('Chyba při nahrávání fotky: ' + uploadError.message)
    photoUrls.push(path)
  }

  const customData = parseExtendedData(formData)

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
    ...(customData ? { custom_data: customData } : {}),
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
    validatePhoto(photo)
    const ext = (photo.name.split('.').pop() ?? 'jpg').toLowerCase()
    const path = `inbody/${clientId}/${Date.now()}-${crypto.randomUUID()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('inbody-photos')
      .upload(path, photo)
    if (uploadError) throw new Error('Chyba při nahrávání fotky: ' + uploadError.message)
    photoUrls.push(path)
  }

  const customData = parseExtendedData(formData)

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
    custom_data: customData ?? {},
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
  const results = await Promise.all(
    paths.map((path) =>
      supabase.storage.from('inbody-photos').createSignedUrl(path, 3600)
    )
  )
  return results
    .filter((r) => !r.error && r.data)
    .map((r) => r.data!.signedUrl)
}
