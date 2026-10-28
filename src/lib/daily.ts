import { addDays, startOfDay, subYears } from 'date-fns'
import { isRun } from './activities'
import { dayKey, parseLocal, weekStart } from './dates'
import type { Activity } from './types'

export interface DayVolume {
  /** "YYYY-MM-DD". */
  date: string
  day: Date
  distanceM: number
  movingS: number
  runs: number
  /** Ids of the runs on this day, for opening one directly. */
  ids: string[]
}

export interface HeatmapData {
  /** One entry per week, each with 7 days (Monday first). Days outside the period are null. */
  weeks: (DayVolume | null)[][]
  start: Date
  end: Date
  days: DayVolume[]
  totalM: number
  activeDays: number
}

export const HEATMAP_MONTHS = 12

/**
 * Daily running totals for a calendar heatmap, covering the last 12 months
 * (or less when there isn't that much data), aligned to whole weeks.
 */
export function buildHeatmap(activities: Activity[], today = new Date()): HeatmapData {
  const byDay = new Map<string, DayVolume>()
  let earliest: Date | null = null

  for (const a of activities) {
    if (!isRun(a)) continue
    const day = startOfDay(parseLocal(a.date))
    if (!earliest || day < earliest) earliest = day
    const key = dayKey(day)
    const entry = byDay.get(key) ?? { date: key, day, distanceM: 0, movingS: 0, runs: 0, ids: [] }
    entry.distanceM += a.distanceM
    entry.movingS += a.movingS
    entry.runs += 1
    entry.ids.push(a.id)
    byDay.set(key, entry)
  }

  const end = startOfDay(today)
  const yearAgo = startOfDay(subYears(end, 1))
  const start = weekStart(earliest && earliest > yearAgo ? earliest : yearAgo)

  const weeks: (DayVolume | null)[][] = []
  const days: DayVolume[] = []
  for (let w = start; w <= end; w = addDays(w, 7)) {
    const week: (DayVolume | null)[] = []
    for (let i = 0; i < 7; i++) {
      const day = addDays(w, i)
      if (day > end) {
        week.push(null)
        continue
      }
      const entry = byDay.get(dayKey(day)) ?? {
        date: dayKey(day),
        day,
        distanceM: 0,
        movingS: 0,
        runs: 0,
        ids: [],
      }
      week.push(entry)
      days.push(entry)
    }
    weeks.push(week)
  }

  return {
    weeks,
    start,
    end,
    days,
    totalM: days.reduce((s, d) => s + d.distanceM, 0),
    activeDays: days.filter((d) => d.runs > 0).length,
  }
}

/** Shading steps in km: 0 is a rest day, then four levels. */
export const HEATMAP_STEPS = [4, 8, 12] as const

export function heatmapLevel(distanceM: number): 0 | 1 | 2 | 3 | 4 {
  if (distanceM <= 0) return 0
  const km = distanceM / 1000
  if (km < HEATMAP_STEPS[0]) return 1
  if (km < HEATMAP_STEPS[1]) return 2
  if (km < HEATMAP_STEPS[2]) return 3
  return 4
}
