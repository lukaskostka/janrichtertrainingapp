'use server'

import { createAuthenticatedClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type { ExerciseSet } from '@/types'

const exerciseSetSchema = z.array(z.object({
  reps: z.number().int().nonnegative(),
  weight: z.number().nonnegative(),
}))

type SessionExerciseWithExercise = {
  id: string
  session_id: string
  exercise_id: string
  order_index: number
  sets: ExerciseSet[]
  notes: string | null
  superset_group: number | null
  exercises: { id: string; name: string }
}

export async function getSessionExercises(sessionId: string): Promise<SessionExerciseWithExercise[]> {
  const { supabase } = await createAuthenticatedClient()
  const { data, error } = await supabase
    .from('session_exercises')
    .select('*, exercises(id, name)')
    .eq('session_id', sessionId)
    .order('order_index')
  if (error) throw error
  return data as unknown as SessionExerciseWithExercise[]
}

export async function addSessionExercise(sessionId: string, exerciseId: string, orderIndex: number): Promise<SessionExerciseWithExercise> {
  const { supabase } = await createAuthenticatedClient()
  const { data, error } = await supabase
    .from('session_exercises')
    .insert({ session_id: sessionId, exercise_id: exerciseId, order_index: orderIndex, sets: [] })
    .select('*, exercises(id, name)')
    .single()
  if (error) throw error
  return data as unknown as SessionExerciseWithExercise
}

export async function updateSessionExerciseSets(id: string, sets: { reps: number; weight: number }[]) {
  const validatedSets = exerciseSetSchema.parse(sets)
  const { supabase } = await createAuthenticatedClient()
  const { error } = await supabase
    .from('session_exercises')
    .update({ sets: validatedSets })
    .eq('id', id)
  if (error) throw error
}

export async function updateSessionExerciseNotes(id: string, notes: string) {
  const { supabase } = await createAuthenticatedClient()
  const { error } = await supabase
    .from('session_exercises')
    .update({ notes })
    .eq('id', id)
  if (error) throw error
}

export async function updateSessionExerciseSuperset(id: string, supersetGroup: number | null) {
  const { supabase } = await createAuthenticatedClient()
  const { error } = await supabase
    .from('session_exercises')
    .update({ superset_group: supersetGroup })
    .eq('id', id)
  if (error) throw error
}

export async function removeSessionExercise(id: string) {
  const { supabase } = await createAuthenticatedClient()
  const { error } = await supabase
    .from('session_exercises')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function getLastExerciseSets(clientId: string, exerciseId: string) {
  const { supabase } = await createAuthenticatedClient()
  // Get the most recent completed session for this client that includes this exercise
  const { data, error } = await supabase
    .from('session_exercises')
    .select('sets, sessions!inner(client_id, status, scheduled_at)')
    .eq('exercise_id', exerciseId)
    .eq('sessions.client_id', clientId)
    .eq('sessions.status', 'completed')
    .order('sessions(scheduled_at)', { ascending: false })
    .limit(1)
  if (error) {
    // Fallback: batch query recent sessions instead of N+1 loop
    const { data: sessions } = await supabase
      .from('sessions')
      .select('id')
      .eq('client_id', clientId)
      .eq('status', 'completed')
      .order('scheduled_at', { ascending: false })
      .limit(10)

    if (sessions && sessions.length > 0) {
      const sessionIds = sessions.map(s => s.id)
      const { data: exercises } = await supabase
        .from('session_exercises')
        .select('sets, session_id')
        .eq('exercise_id', exerciseId)
        .in('session_id', sessionIds)

      if (exercises && exercises.length > 0) {
        // Find the first match in chronological order (most recent first)
        for (const sid of sessionIds) {
          const match = exercises.find(e => e.session_id === sid)
          if (match?.sets) {
            return match.sets
          }
        }
      }
    }
    return []
  }
  return data?.[0]?.sets || []
}

export async function loadTemplateExercises(
  sessionId: string,
  clientId: string,
  templateExercises: { exercise_id: string; exercise_name?: string; sets_config?: { reps: number; weight: number }[]; superset_group?: number | null }[],
  startIndex: number
) {
  // 1. Insert all exercises in parallel (separate calls due to RLS)
  const inserted = await Promise.all(
    templateExercises.map((te, i) =>
      addSessionExercise(sessionId, te.exercise_id, startIndex + i)
    )
  )

  // 2. Fetch all prefills in parallel
  const prefills = await Promise.all(
    templateExercises.map(te => getLastExerciseSets(clientId, te.exercise_id))
  )

  // 3. Determine final sets and update in parallel
  const { supabase } = await createAuthenticatedClient()
  await Promise.all(
    inserted.map(async (record, i) => {
      const te = templateExercises[i]
      const prefill = prefills[i] as ExerciseSet[] | undefined
      const finalSets: ExerciseSet[] = (Array.isArray(prefill) && prefill.length > 0)
        ? prefill
        : (te.sets_config || [])

      const updates: Record<string, unknown> = {}
      if (finalSets.length > 0) updates.sets = finalSets
      if (te.superset_group != null) updates.superset_group = te.superset_group

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from('session_exercises')
          .update(updates)
          .eq('id', record.id)
        if (error) throw error
      }
    })
  )

  // 4. Return the final state of all exercises
  return inserted.map((record, i) => {
    const te = templateExercises[i]
    const prefill = prefills[i] as ExerciseSet[] | undefined
    const finalSets: ExerciseSet[] = (Array.isArray(prefill) && prefill.length > 0)
      ? prefill
      : (te.sets_config || [])

    return {
      id: record.id,
      exercise_id: record.exercise_id,
      order_index: record.order_index,
      sets: finalSets,
      notes: record.notes,
      superset_group: te.superset_group ?? null,
      exercises: record.exercises,
    }
  })
}
