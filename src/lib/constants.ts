import { Home, Users, Calendar, Dumbbell, Settings } from 'lucide-react'

export const NAV_ITEMS = [
  { href: '/', label: 'Domů', icon: Home },
  { href: '/clients', label: 'Klienti', icon: Users },
  { href: '/calendar', label: 'Kalendář', icon: Calendar },
  { href: '/exercises', label: 'Cviky', icon: Dumbbell },
  { href: '/settings', label: 'Nastavení', icon: Settings },
] as const

export const SESSION_DURATION_MINUTES = 60

export const CLIENT_STATUS_LABELS: Record<string, string> = {
  active: 'Aktivní',
  inactive: 'Neaktivní',
  archived: 'Archivovaný',
}

export const PACKAGE_STATUS_LABELS: Record<string, string> = {
  active: 'Aktivní',
  completed: 'Dokončený',
  expired: 'Expirovaný',
}

export const SESSION_STATUS_LABELS: Record<string, string> = {
  scheduled: 'Naplánováno',
  completed: 'Dokončeno',
  cancelled: 'Zrušeno',
  no_show: 'Nedostavil se',
}

export const SESSION_STATUS_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
  scheduled: 'default',
  completed: 'success',
  cancelled: 'danger',
  no_show: 'warning',
}
