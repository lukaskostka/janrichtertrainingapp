import { NextResponse } from 'next/server'
import { createAuthenticatedClient } from '@/lib/supabase/server'
import { autoCompleteExpiredSessions } from '@/lib/actions/sessions'

export async function POST() {
  try {
    await createAuthenticatedClient()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await autoCompleteExpiredSessions()
  return NextResponse.json({ ok: true })
}
