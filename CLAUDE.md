# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FitCoach is a mobile-first PWA for a single personal trainer (Jan Richter) to manage clients, training packages, session scheduling, live workout logging, and body composition tracking. The app language/UI is Czech.

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Database/Auth/Storage:** Supabase (PostgreSQL + Auth + Storage)
- **Styling:** Tailwind CSS (dark monochromatic theme)
- **Charts:** Recharts (InBody progress)
- **Animations:** Framer Motion
- **Dates:** date-fns
- **ICS generation:** ical-generator
- **PWA:** @ducanh2912/next-pwa
- **Icons:** Lucide (thin stroke)
- **Hosting:** Vercel

## Common Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # Run ESLint
npm run start        # Start production server
```

## Architecture

```
Next.js PWA (App Router) → Next.js API Routes → Supabase (PostgreSQL + Auth + Storage)
```

- **Single-user model:** One trainer authenticated via Supabase Auth (email/password). All tables use RLS policies filtering on `auth.uid()`.
- **No client-facing access:** Only the trainer logs in and uses the app.
- **ICS calendar feed:** `/api/ics/[token]` generates ICS dynamically per request. Apple Calendar subscribes via `webcal://` and polls ~every 15 min. Three alarm types: standard (15min before), InBody reminder (first session in package), last-session warning (5min before end).

## Route Structure

```
/                              → Dashboard (today's sessions, alerts, quick stats)
/login                         → Auth
/clients, /clients/new, /clients/[id]  → Client management (profile has tabs: overview, packages, sessions, inbody)
/clients/[id]/packages/new     → New package
/clients/[id]/inbody/new       → New InBody measurement
/calendar                      → Week/day calendar view
/sessions/new, /sessions/[id]  → Session scheduling/details
/sessions/[id]/live            → Live workout logging (highest-traffic route during operation)
/exercises, /templates         → Exercise library & workout templates
/settings                      → Profile, ICS URL management
/api/ics/[token]               → Public ICS feed endpoint
```

## Database Schema (9 tables)

- **trainers** — single trainer profile, holds `ics_token`
- **clients** — trainer's clients with status (active/inactive/archived)
- **packages** — training packages (session count, payment tracking). One active package per client.
- **sessions** — scheduled training sessions (always 60 min). States: scheduled/completed/cancelled/no_show
- **exercises** — trainer's exercise library (name only)
- **session_exercises** — exercises logged in a session with `sets` JSONB (`[{"reps": 12, "weight": 80}]`) and optional `superset_group`
- **workout_templates** — reusable exercise configurations with `exercises` JSONB
- **inbody_records** — body composition measurements with `photo_urls` (Supabase Storage)

RLS policies: Direct tables filter `trainer_id = auth.uid()`. Nested tables (packages, session_exercises, inbody_records) filter via subquery joins to parent tables.

## Critical Business Rules

1. **One active package per client** — new package only after previous is completed/expired
2. **Session completion** increments `used_sessions`; when `used == total`, package status becomes `completed`
3. **Cancelled/no-show sessions** do NOT decrement from package
4. **Exercise pre-fill:** When adding an exercise in live session, auto-populate reps/weight from the client's most recent session with that exercise
5. **InBody reminder** is tied to first session in a new package, not a time interval

## Design System

- **Dark UI:** `gray-800` (#1A1A1A) background, `gray-900` (#111111) cards, white text
- **Functional colors:** green (#22C55E) success, orange (#F59E0B) warning, red (#EF4444) danger — minimal use
- **Typography:** Satoshi (headings), Inter (body)
- **Patterns:** bottom sheets instead of modals, Framer Motion animations (fade-in, staggered lists, scale on tap), haptic feedback on key actions
- **Cards:** gray-900 bg, gray-600 border, 12px border-radius

## Specification

The full spec is in `fitcoach-final-spec.md` (Czech). Consult it for detailed ICS generation logic, UI mockups, and database schema SQL.
