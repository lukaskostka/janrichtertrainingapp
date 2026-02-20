import { NextResponse } from 'next/server'
import ical, { ICalAlarmType } from 'ical-generator'
import { createClient } from '@supabase/supabase-js'

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 30
const RATE_WINDOW = 60_000

function checkRateLimit(token: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  // Cleanup stale entries periodically
  if (rateLimitMap.size > 100) {
    for (const [key, entry] of rateLimitMap) {
      if (now > entry.resetAt) rateLimitMap.delete(key)
    }
  }

  const entry = rateLimitMap.get(token)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(token, { count: 1, resetAt: now + RATE_WINDOW })
    return { allowed: true, remaining: RATE_LIMIT - 1, resetAt: now + RATE_WINDOW }
  }
  if (entry.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }
  entry.count++
  return { allowed: true, remaining: RATE_LIMIT - entry.count, resetAt: entry.resetAt }
}

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface SessionExerciseRow {
  id: string
  session_id: string
  exercise_id: string
  order_index: number
  sets: { reps: number; weight: number }[]
  notes: string | null
  superset_group: number | null
  exercises: { id: string; name: string }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const rateLimit = checkRateLimit(token)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': RATE_LIMIT.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.ceil(rateLimit.resetAt / 1000).toString(),
        },
      }
    )
  }
  const supabase = createServiceClient()

  // Look up trainer by ICS token
  const { data: trainer, error: trainerError } = await supabase
    .from('trainers')
    .select('id, name')
    .eq('ics_token', token)
    .single()

  if (trainerError || !trainer) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
  }

  // Fetch scheduled and completed sessions with client and package info
  const { data: sessions, error: sessionsError } = await supabase
    .from('sessions')
    .select('*, clients(id, name), packages(id, name, total_sessions, used_sessions)')
    .eq('trainer_id', trainer.id)
    .in('status', ['scheduled', 'completed'])
    .order('scheduled_at', { ascending: true })

  if (sessionsError) {
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
  }

  // Batch fetch all session exercises with exercise names
  const sessionIds = (sessions || []).map((s) => s.id)
  const sessionExercisesMap = new Map<string, SessionExerciseRow[]>()

  if (sessionIds.length > 0) {
    const { data: allExercises } = await supabase
      .from('session_exercises')
      .select('*, exercises(id, name)')
      .in('session_id', sessionIds)
      .order('order_index', { ascending: true })

    if (allExercises) {
      for (const ex of allExercises as SessionExerciseRow[]) {
        if (!sessionExercisesMap.has(ex.session_id)) {
          sessionExercisesMap.set(ex.session_id, [])
        }
        sessionExercisesMap.get(ex.session_id)!.push(ex)
      }
    }
  }

  // Determine first and last sessions per package for alarm logic
  const packageSessions = new Map<string, typeof sessions>()
  for (const session of sessions || []) {
    if (session.package_id) {
      if (!packageSessions.has(session.package_id)) {
        packageSessions.set(session.package_id, [])
      }
      packageSessions.get(session.package_id)!.push(session)
    }
  }

  const cal = ical({
    name: 'Jan Richter \u2013 Training',
    timezone: 'Europe/Prague',
    prodId: { company: 'Jan Richter Training', product: 'FitCoach' },
    ttl: 900, // 15 minutes refresh interval
  })

  for (const session of sessions || []) {
    const clientName = (session.clients as { id: string; name: string })?.name || 'Klient'
    const pkg = session.packages as { id: string; name: string; total_sessions: number; used_sessions: number } | null
    const start = new Date(session.scheduled_at)
    const end = new Date(start.getTime() + session.duration_minutes * 60 * 1000)

    // Build rich description
    const descParts: string[] = []
    descParts.push(`Tr\u00e9nink \u2013 ${clientName}`)

    if (pkg) {
      descParts.push(`Bal\u00ed\u010dek: ${pkg.name} (${pkg.used_sessions}/${pkg.total_sessions})`)
    }

    // Add exercise details
    const exercises = sessionExercisesMap.get(session.id)
    if (exercises && exercises.length > 0) {
      descParts.push('')
      descParts.push('Pl\u00e1novan\u00e9 cviky:')

      // Group exercises by superset_group before rendering
      type ExGroup = { supersetGroup: number | null; exercises: SessionExerciseRow[] }
      const groups: ExGroup[] = []
      let currentGroup: ExGroup | null = null
      for (const ex of exercises) {
        if (ex.superset_group !== null && currentGroup !== null && currentGroup.supersetGroup === ex.superset_group) {
          currentGroup.exercises.push(ex)
        } else {
          currentGroup = { supersetGroup: ex.superset_group, exercises: [ex] }
          groups.push(currentGroup)
        }
      }

      let exIndex = 0
      for (const group of groups) {
        if (group.supersetGroup !== null && group.exercises.length > 1) {
          descParts.push(`\nSuperset:`)
          for (const ex of group.exercises) {
            exIndex++
            const exName = ex.exercises?.name || 'Cvik'
            const sets = Array.isArray(ex.sets) ? ex.sets : []
            let setDesc = ''
            if (sets.length > 0) {
              setDesc = ` \u2013 ${sets.length}x${sets[0].reps}`
              if (sets[0].weight > 0) setDesc += ` @ ${sets[0].weight}kg`
            }
            descParts.push(`  ${exIndex}. ${exName}${setDesc}`)
          }
        } else {
          for (const ex of group.exercises) {
            exIndex++
            const exName = ex.exercises?.name || 'Cvik'
            const sets = Array.isArray(ex.sets) ? ex.sets : []
            let setDesc = ''
            if (sets.length > 0) {
              setDesc = ` \u2013 ${sets.length}x${sets[0].reps}`
              if (sets[0].weight > 0) setDesc += ` @ ${sets[0].weight}kg`
            }
            descParts.push(`${exIndex}. ${exName}${setDesc}`)
          }
        }
      }
    }

    if (session.notes) {
      descParts.push('')
      descParts.push(`Pozn\u00e1mky: ${session.notes}`)
    }

    const description = descParts.join('\n')

    const event = cal.createEvent({
      id: session.id,
      start,
      end,
      timezone: 'Europe/Prague',
      summary: `Tr\u00e9nink \u2013 ${clientName}`,
      description,
      location: session.location || undefined,
    })

    // Standard alarm: 15 min before every session
    event.createAlarm({
      type: ICalAlarmType.display,
      trigger: -15 * 60,
      description: `Tr\u00e9nink \u2013 ${clientName}`,
    })

    if (session.package_id && pkg) {
      const sessionsInPackage = packageSessions.get(session.package_id) || []

      // First session in package: InBody reminder (5 min before)
      if (sessionsInPackage.length > 0 && sessionsInPackage[0].id === session.id) {
        // Check if this is the first session (used_sessions === 0 means no sessions used yet)
        if (pkg.used_sessions === 0) {
          event.createAlarm({
            type: ICalAlarmType.display,
            trigger: -5 * 60,
            description: `\ud83d\udccf \u010cas na InBody m\u011b\u0159en\u00ed \u2013 ${clientName}`,
          })
        }
      }

      // Last session in package warning — only for the first scheduled session that would complete the package
      const scheduledInPackage = sessionsInPackage.filter((s: { status: string }) => s.status === 'scheduled')
      const isLastByCount = pkg.used_sessions + 1 >= pkg.total_sessions
      const isFirstScheduledThatCompletes = isLastByCount && scheduledInPackage.length > 0 && scheduledInPackage[0].id === session.id
      if (isFirstScheduledThatCompletes) {
        event.createAlarm({
          type: ICalAlarmType.display,
          trigger: Math.max(0, (session.duration_minutes - 5) * 60),
          description: `\u26a0\ufe0f Posledn\u00ed tr\u00e9nink z bal\u00ed\u010dku \u2013 p\u0159ipomenout platbu \u2013 ${clientName}`,
        })
      }
    }
  }

  return new NextResponse(cal.toString(), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="jan-richter-training.ics"',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-RateLimit-Limit': RATE_LIMIT.toString(),
      'X-RateLimit-Remaining': rateLimit.remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(rateLimit.resetAt / 1000).toString(),
    },
  })
}
