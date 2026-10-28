import { addWeeks, endOfDay, startOfDay, subMonths, subYears } from 'date-fns'
import { parseLocal, weekStart } from './dates'
import type { Activity, DateRange, RangePreset } from './types'

export const RANGE_PRESETS: { value: RangePreset; label: string }[] = [
  { value: '12w', label: '12w' },
  { value: '6m', label: '6m' },
  { value: '1y', label: '1y' },
  { value: 'all', label: 'All' },
]

function startFor(preset: RangePreset, end: Date, earliest: Date): Date {
  switch (preset) {
    case '12w':
      return addWeeks(weekStart(end), -11)
    case '6m':
      return startOfDay(subMonths(end, 6))
    case '1y':
      return startOfDay(subYears(end, 1))
    case 'all':
      return startOfDay(earliest)
  }
}

/**
 * Ranges end today. If the data is too old to appear in that window
 * (e.g. an old export), the range ends at the latest activity instead.
 */
export function resolveRange(preset: RangePreset, activities: Activity[], today = new Date()): DateRange {
  if (activities.length === 0) {
    const end = endOfDay(today)
    return { start: startFor(preset, end, end), end }
  }
  const dates = activities.map((a) => parseLocal(a.date).getTime())
  const earliest = new Date(Math.min(...dates))
  const latest = new Date(Math.max(...dates))

  let end = endOfDay(today)
  let start = startFor(preset, end, earliest)
  if (latest < start) {
    end = endOfDay(latest)
    start = startFor(preset, end, earliest)
  }
  return { start, end }
}
