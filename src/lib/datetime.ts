import { TZDate } from '@date-fns/tz'
import { format, startOfWeek, endOfWeek, startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns'

export const PRAGUE_TZ = 'Europe/Prague'

export function toPragueDate(date: string | Date) {
  if (typeof date === 'string') return new TZDate(date, PRAGUE_TZ)
  return new TZDate(date, PRAGUE_TZ)
}

export function toUtcIsoFromLocalInput(local: string) {
  if (!local) return local
  const normalized = local.length === 16 ? `${local}:00` : local
  const tzDate = new TZDate(normalized, PRAGUE_TZ)
  return tzDate.toISOString()
}

export function toLocalInputValue(date: string | Date) {
  const tzDate = toPragueDate(date)
  return format(tzDate, "yyyy-MM-dd'T'HH:mm")
}

export function ensureUtcIso(value: string) {
  if (!value) return value
  if (/Z$|[+-]\d{2}:\d{2}$/.test(value)) return value
  return toUtcIsoFromLocalInput(value)
}

export function startOfWeekUtc(date: Date) {
  const tzDate = toPragueDate(date)
  return startOfWeek(tzDate, { weekStartsOn: 1 }).toISOString()
}

export function endOfWeekUtc(date: Date) {
  const tzDate = toPragueDate(date)
  return endOfWeek(tzDate, { weekStartsOn: 1 }).toISOString()
}

export function startOfDayUtc(date: Date) {
  const tzDate = toPragueDate(date)
  return startOfDay(tzDate).toISOString()
}

export function endOfDayUtc(date: Date) {
  const tzDate = toPragueDate(date)
  return endOfDay(tzDate).toISOString()
}

export function startOfMonthUtc(date: Date) {
  const tzDate = toPragueDate(date)
  return startOfMonth(tzDate).toISOString()
}

export function endOfMonthUtc(date: Date) {
  const tzDate = toPragueDate(date)
  return endOfMonth(tzDate).toISOString()
}
