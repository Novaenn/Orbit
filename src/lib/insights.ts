import { isRun } from './activities'
import { dayKey, eachWeek, parseLocal, weekKey } from './dates'
import { ZONE_COUNT } from './hrZones'
import { vdotFromPerformance } from './predict'
import { raceTime } from './races'
import { classifyRun } from './runTypes'
import type { Activity, DateRange } from './types'

export const ROLLING_WINDOW_DAYS = 28

/** Runs above this share of threshold pace aren't easy running. */
export const MAX_EASY_INTENSITY = 100

const DAY_MS = 86_400_000

export interface DatedValue {
  date: string
  /** Start of the day in ms, for the chart's time axis. */
  ts: number
  value: number
}

export interface RollingValue extends DatedValue {
  /** Mean of the values in the trailing window, including this point. */
  average: number
}

function startOfDayTs(date: string): number {
  return parseLocal(date.slice(0, 10)).getTime()
}

/**
 * Trailing average over `windowDays`. Each point averages every point from the
 * same day back to (but not including) exactly one window earlier.
 * Points must be sorted oldest first; the result keeps that order.
 */
export function rollingAverage<T extends DatedValue>(
  points: readonly T[],
  windowDays = ROLLING_WINDOW_DAYS,
): (T & { average: number })[] {
  const sorted = [...points].sort((a, b) => a.ts - b.ts)
  let first = 0
  return sorted.map((point, i) => {
    const from = point.ts - windowDays * DAY_MS
    while (first <= i && sorted[first].ts <= from) first++
    let sum = 0
    for (let j = first; j <= i; j++) sum += sorted[j].value
    return { ...point, average: sum / (i - first + 1) }
  })
}

export function withinRange<T extends { ts: number }>(points: readonly T[], range: DateRange): T[] {
  const start = range.start.getTime()
  const end = range.end.getTime()
  return points.filter((p) => p.ts >= start && p.ts <= end)
}

/** Metres covered per heartbeat: speed (m/min) divided by heart rate (bpm). */
export function efficiencyMetersPerBeat(a: Activity): number | null {
  if (!a.avgHr || a.avgHr <= 0 || a.distanceM <= 0 || a.movingS <= 0) return null
  return (a.distanceM / a.movingS) * 60 / a.avgHr
}

export interface RunPoint extends RollingValue {
  activity: Activity
}

/**
 * Easy and long runs with a heart rate, one point per run. This is the only
 * progression with enough points to show a trend rather than a few dots.
 */
export function efficiencySeries(
  activities: Activity[],
  range: DateRange,
  raceIds?: ReadonlySet<string>,
): RunPoint[] {
  const points = activities
    .filter(isRun)
    .filter((a) => {
      const type = classifyRun(a, raceIds)
      return type === 'easy' || type === 'long'
    })
    .filter((a) => a.intensity === null || a.intensity <= MAX_EASY_INTENSITY)
    .map((a) => {
      const value = efficiencyMetersPerBeat(a)
      return value === null
        ? null
        : { activity: a, date: a.date.slice(0, 10), ts: startOfDayTs(a.date), value }
    })
    .filter((p): p is { activity: Activity; date: string; ts: number; value: number } => p !== null)

  return withinRange(rollingAverage(points), range)
}

/** One point per run with cadence, plus its trailing 4-week average. */
export function cadenceSeries(activities: Activity[], range: DateRange): RunPoint[] {
  const points = activities
    .filter(isRun)
    .filter((a) => a.cadenceSpm !== null && a.cadenceSpm > 0)
    .map((a) => ({
      activity: a,
      date: a.date.slice(0, 10),
      ts: startOfDayTs(a.date),
      value: a.cadenceSpm as number,
    }))

  return withinRange(rollingAverage(points), range)
}

export interface RacePoint extends DatedValue {
  activity: Activity
}

/** VDOT from every race in the range, oldest first. */
export function vdotSeries(races: Activity[], range: DateRange): RacePoint[] {
  return races
    .filter((r) => r.distanceM >= 1500 && raceTime(r) > 0)
    .filter((r) => {
      const d = parseLocal(r.date)
      return d >= range.start && d <= range.end
    })
    .map((activity) => ({
      activity,
      date: activity.date.slice(0, 10),
      ts: startOfDayTs(activity.date),
      value: vdotFromPerformance(activity.distanceM, raceTime(activity)),
    }))
    .sort((a, b) => a.ts - b.ts)
}

export interface WeekZones {
  /** Monday of the week, "YYYY-MM-DD". */
  week: string
  weekStart: Date
  /** Seconds in zones 1–7. */
  seconds: number[]
  totalS: number
  /** Runs in the week that have heart-rate zone data. */
  runs: number
}

/** Weekly time per heart-rate zone, for runs. Weeks without data are included as zeros. */
export function weeklyZoneTotals(activities: Activity[], range: DateRange): WeekZones[] {
  const byWeek = new Map<string, { seconds: number[]; runs: number }>()
  for (const a of activities) {
    if (!isRun(a) || !a.hrZoneSecs) continue
    const d = parseLocal(a.date)
    if (d < range.start || d > range.end) continue

    const key = weekKey(d)
    const w = byWeek.get(key) ?? { seconds: Array<number>(ZONE_COUNT).fill(0), runs: 0 }
    for (let i = 0; i < ZONE_COUNT; i++) w.seconds[i] += a.hrZoneSecs[i] ?? 0
    w.runs += 1
    byWeek.set(key, w)
  }

  return eachWeek(range.start, range.end).map((weekStart) => {
    const key = dayKey(weekStart)
    const w = byWeek.get(key)
    return {
      week: key,
      weekStart,
      seconds: w?.seconds ?? Array<number>(ZONE_COUNT).fill(0),
      totalS: w?.seconds.reduce((s, v) => s + v, 0) ?? 0,
      runs: w?.runs ?? 0,
    }
  })
}

/** Share of a week's zone time spent in zones `from`–`to` (0-based, inclusive). */
export function zoneShare(seconds: readonly number[], from: number, to: number): number {
  const total = seconds.reduce((s, v) => s + v, 0)
  if (total === 0) return 0
  let part = 0
  for (let i = from; i <= to; i++) part += seconds[i] ?? 0
  return part / total
}

export interface PatternBucket {
  key: string
  label: string
  shortLabel: string
  runs: number
  distanceM: number
  movingS: number
  /** Average pace in seconds per km, null when there was no distance. */
  pace: number | null
}

const WEEKDAYS: { key: string; label: string; shortLabel: string }[] = [
  { key: 'mon', label: 'Monday', shortLabel: 'Mon' },
  { key: 'tue', label: 'Tuesday', shortLabel: 'Tue' },
  { key: 'wed', label: 'Wednesday', shortLabel: 'Wed' },
  { key: 'thu', label: 'Thursday', shortLabel: 'Thu' },
  { key: 'fri', label: 'Friday', shortLabel: 'Fri' },
  { key: 'sat', label: 'Saturday', shortLabel: 'Sat' },
  { key: 'sun', label: 'Sunday', shortLabel: 'Sun' },
]

function emptyBuckets(defs: { key: string; label: string; shortLabel: string }[]): PatternBucket[] {
  return defs.map((d) => ({ ...d, runs: 0, distanceM: 0, movingS: 0, pace: null }))
}

function addToBucket(b: PatternBucket, a: Activity): void {
  b.runs += 1
  b.distanceM += a.distanceM
  b.movingS += a.movingS
}

function finish(b: PatternBucket): PatternBucket {
  return {
    ...b,
    pace: b.distanceM > 0 && b.movingS > 0 ? b.movingS / (b.distanceM / 1000) : null,
  }
}

/** Run counts per weekday, Monday first. */
export function weekdayPattern(activities: Activity[], range: DateRange): PatternBucket[] {
  const buckets = emptyBuckets(WEEKDAYS)
  for (const a of activities) {
    if (!isRun(a)) continue
    const d = parseLocal(a.date)
    if (d < range.start || d > range.end) continue
    addToBucket(buckets[(d.getDay() + 6) % 7], a)
  }
  return buckets.map(finish)
}

/** Run counts per hour of the day (start time as written in the CSV). */
export function hourPattern(activities: Activity[], range: DateRange): PatternBucket[] {
  const defs = Array.from({ length: 24 }, (_, h) => {
    const hour = String(h).padStart(2, '0')
    return { key: hour, label: `${hour}:00`, shortLabel: hour }
  })
  const buckets = emptyBuckets(defs)
  for (const a of activities) {
    if (!isRun(a)) continue
    const d = parseLocal(a.date)
    if (d < range.start || d > range.end) continue
    addToBucket(buckets[Number(a.date.slice(11, 13))], a)
  }
  return buckets.map(finish)
}

export interface ThresholdStep {
  date: string
  ts: number
  /** Seconds per km. */
  pace: number
}

/** Threshold values that last less than this are treated as noise, not a new step. */
export const MIN_THRESHOLD_STEP_DAYS = 3

/**
 * intervals.icu's threshold pace over time, as step points: the value changes
 * when the export's `threshold_pace` column changes. Very short-lived values
 * (a race-week tweak, say) are skipped so the line shows real progression.
 * Includes a starting value when the last update happened before the range,
 * and extends the final value to the end of the range.
 */
export function thresholdPaceSteps(activities: Activity[], range: DateRange): ThresholdStep[] {
  // One value per day: if a day has several activities, the latest one wins.
  const byDate = new Map<string, { ts: number; at: number; pace: number }>()
  for (const a of activities) {
    if (!isRun(a) || !a.thresholdPaceMps || a.thresholdPaceMps <= 0) continue
    const key = a.date.slice(0, 10)
    const at = parseLocal(a.date).getTime()
    const existing = byDate.get(key)
    if (!existing || at > existing.at) {
      byDate.set(key, { ts: startOfDayTs(a.date), at, pace: 1000 / a.thresholdPaceMps })
    }
  }

  // Collapse repeated daily values into the points where the threshold changed.
  const raw: ThresholdStep[] = []
  for (const [date, p] of [...byDate.entries()].sort(([, a], [, b]) => a.ts - b.ts)) {
    const previous = raw.at(-1)
    if (!previous || Math.abs(previous.pace - p.pace) >= 0.01) {
      raw.push({ date, ts: p.ts, pace: p.pace })
    }
  }

  // Skip values that were replaced again within a few days.
  const stable = raw.filter((point, i) => {
    const next = raw[i + 1]
    return !next || next.ts - point.ts >= MIN_THRESHOLD_STEP_DAYS * DAY_MS
  })
  const changes: ThresholdStep[] = []
  for (const point of stable) {
    const previous = changes.at(-1)
    if (!previous || Math.abs(previous.pace - point.pace) >= 0.01) changes.push(point)
  }

  const start = range.start.getTime()
  const end = range.end.getTime()
  let lastBefore: ThresholdStep | null = null
  const inside: ThresholdStep[] = []
  for (const point of changes) {
    if (point.ts < start) lastBefore = point
    else if (point.ts <= end) inside.push(point)
  }

  const steps: ThresholdStep[] = []
  if (lastBefore) steps.push({ ...lastBefore, date: dayKey(range.start), ts: start })
  steps.push(...inside)
  const last = steps.at(-1)
  if (last && last.ts < end) steps.push({ date: dayKey(range.end), ts: end, pace: last.pace })
  return steps
}

/** Mean of the first and last `sample` values, as a relative change (0.12 = +12%). */
export function relativeChange(values: readonly number[], sample = 4): number | null {
  if (values.length < 2) return null
  const size = Math.min(sample, Math.max(1, Math.floor(values.length / 2)))
  const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length
  const start = mean(values.slice(0, size))
  const end = mean(values.slice(-size))
  return start === 0 ? null : end / start - 1
}
