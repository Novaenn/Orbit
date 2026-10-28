import { addDays, format, startOfDay, startOfWeek } from 'date-fns'

/** Parses "YYYY-MM-DDTHH:mm:ss" as a local date (no time zone shifting). */
export function parseLocal(date: string): Date {
  const [y, m, d] = date.slice(0, 10).split('-').map(Number)
  const time = date.length > 10 ? date.slice(11) : ''
  const [hh = 0, mm = 0, ss = 0] = time ? time.split(':').map(Number) : []
  return new Date(y, m - 1, d, hh, mm, ss)
}

export function dayKey(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function weekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 })
}

export function weekKey(date: Date): string {
  return dayKey(weekStart(date))
}

export function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / 86_400_000)
}

export function eachWeek(start: Date, end: Date): Date[] {
  const weeks: Date[] = []
  for (let w = weekStart(start); w <= end; w = addDays(w, 7)) weeks.push(w)
  return weeks
}
