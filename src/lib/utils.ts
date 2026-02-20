import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'
import { cs } from 'date-fns/locale'
import { toPragueDate } from '@/lib/datetime'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return format(toPragueDate(date), 'd. M. yyyy', { locale: cs })
}

export function formatTime(date: string | Date) {
  return format(toPragueDate(date), 'HH:mm', { locale: cs })
}

export function formatDateTime(date: string | Date) {
  return format(toPragueDate(date), 'd. M. yyyy HH:mm', { locale: cs })
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', minimumFractionDigits: 0 }).format(amount)
}
