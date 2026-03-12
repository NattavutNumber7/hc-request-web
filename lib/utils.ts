import { createServerClient } from './supabase'

export async function generateRequestId(): Promise<string> {
  const db = createServerClient()
  const { count } = await db
    .from('hc_requests')
    .select('*', { count: 'exact', head: true })

  const num = (count || 0) + 1
  return `HC-${String(num).padStart(6, '0')}`
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
}
