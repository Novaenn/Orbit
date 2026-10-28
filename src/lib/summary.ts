import { addWeeks, endOfDay, startOfMonth, startOfYear } from 'date-fns'
import { isRun } from './activities'
import { parseLocal, weekKey, weekStart } from './dates'
import type { Activity } from './types'

export interface PeriodTotals {
  distanceM: number
  movingS: number
  runs: number
}

export function runTotals(activities: Activity[], start: Date, end: Date): PeriodTotals {
  const totals: PeriodTotals = { distanceM: 0, movingS: 0, runs: 0 }
  for (const a of activities) {
    if (!isRun(a)) continue
    const d = parseLocal(a.date)
    if (d < start || d > end) continue
    totals.distanceM += a.distanceM
    totals.movingS += a.movingS
    totals.runs += 1
  }
  return totals
}

/**
 * Consecutive weeks (Mon–Sun) with at least one run, counting back from this week.
 * If there's no run yet this week, the streak counts from last week.
 */
export function weeklyStreak(activities: Activity[], today: Date): number {
  const weeks = new Set(activities.filter(isRun).map((a) => weekKey(parseLocal(a.date))))
  let w = weekStart(today)
  if (!weeks.has(weekKey(w))) w = addWeeks(w, -1)
  let streak = 0
  while (weeks.has(weekKey(w))) {
    streak += 1
    w = addWeeks(w, -1)
  }
  return streak
}

export interface Summary {
  thisWeek: PeriodTotals
  lastWeek: PeriodTotals
  thisMonth: PeriodTotals
  yearToDate: PeriodTotals
  last4Weeks: PeriodTotals
  longestRun: Activity | null
  streakWeeks: number
}

export function buildSummary(activities: Activity[], today = new Date()): Summary {
  const end = endOfDay(today)
  const thisWeekStart = weekStart(today)
  const lastWeekStart = addWeeks(thisWeekStart, -1)
  const runs = activities.filter(isRun)

  return {
    thisWeek: runTotals(runs, thisWeekStart, end),
    lastWeek: runTotals(runs, lastWeekStart, new Date(thisWeekStart.getTime() - 1)),
    thisMonth: runTotals(runs, startOfMonth(today), end),
    yearToDate: runTotals(runs, startOfYear(today), end),
    last4Weeks: runTotals(runs, addWeeks(end, -4), end),
    longestRun: runs.reduce<Activity | null>((best, a) => (!best || a.distanceM > best.distanceM ? a : best), null),
    streakWeeks: weeklyStreak(runs, today),
  }
}
