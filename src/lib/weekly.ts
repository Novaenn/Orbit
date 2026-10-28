import { isRun } from './activities'
import { dayKey, eachWeek, parseLocal, weekKey } from './dates'
import type { Activity, DateRange } from './types'

export interface WeekVolume {
  /** Monday of the week, "YYYY-MM-DD". */
  week: string
  weekStart: Date
  km: number
  hours: number
  movingS: number
  distanceM: number
  runs: number
  /** Average pace in seconds per km, null when there were no runs. */
  pace: number | null
}

/** Weekly running volume (Monday–Sunday). Weeks without runs are included with zeros. */
export function weeklyVolume(activities: Activity[], range: DateRange): WeekVolume[] {
  const byWeek = new Map<string, { distanceM: number; movingS: number; runs: number }>()
  for (const a of activities) {
    if (!isRun(a)) continue
    const d = parseLocal(a.date)
    if (d < range.start || d > range.end) continue
    const key = weekKey(d)
    const w = byWeek.get(key) ?? { distanceM: 0, movingS: 0, runs: 0 }
    w.distanceM += a.distanceM
    w.movingS += a.movingS
    w.runs += 1
    byWeek.set(key, w)
  }

  return eachWeek(range.start, range.end).map((ws) => {
    const key = dayKey(ws)
    const w = byWeek.get(key) ?? { distanceM: 0, movingS: 0, runs: 0 }
    return {
      week: key,
      weekStart: ws,
      km: w.distanceM / 1000,
      hours: w.movingS / 3600,
      movingS: w.movingS,
      distanceM: w.distanceM,
      runs: w.runs,
      pace: w.distanceM > 0 ? w.movingS / (w.distanceM / 1000) : null,
    }
  })
}
