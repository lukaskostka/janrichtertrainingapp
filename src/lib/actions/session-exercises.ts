'use server'

import { createAuthenticatedClient } from '@/lib/supabase/server'
import type { ExerciseSet } from '@/types'

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
  const { supabase } = await createAuthenticatedClient()
  const { error } = await supabase
    .from('session_exercises')
    .update({ sets })
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
    // Fallback: iterate through recent sessions to find the exercise
    const { data: sessions } = await supabase
      .from('sessions')
      .select('id')
      .eq('client_id', clientId)
      .eq('status', 'completed')
      .order('scheduled_at', { ascending: false })
      .limit(10)

    if (sessions && sessions.length > 0) {
      for (const s of sessions) {
        const { data: exercises } = await supabase
          .from('session_exercises')
          .select('sets')
          .eq('exercise_id', exerciseId)
          .eq('session_id', s.id)
          .limit(1)

        if (exercises && exercises.length > 0 && exercises[0].sets) {
          return exercises[0].sets
        }
      }
    }
    return []
  }
  return data?.[0]?.sets || []
}
