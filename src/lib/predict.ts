import { endOfDay, subDays } from 'date-fns'
import { isRun } from './activities'
import { daysBetween, parseLocal } from './dates'
import { raceTime } from './races'
import type { Activity } from './types'

export interface Target {
  key: string
  label: string
  distanceM: number
}

export const TARGETS: Target[] = [
  { key: '5k', label: '5K', distanceM: 5000 },
  { key: '10k', label: '10K', distanceM: 10000 },
  { key: 'hm', label: 'Half marathon', distanceM: 21097.5 },
]

export const DEFAULT_RIEGEL_EXPONENT = 1.06
export const EXPONENT_MIN = 1.03
export const EXPONENT_MAX = 1.15
export const RECENCY_HALF_LIFE_DAYS = 28
export const MIN_RACE_DISTANCE_M = 1500
export const WINDOW_OPTIONS = [6, 12, 26, 52] as const
export const DEFAULT_WINDOW_WEEKS = 12

/** Riegel: T2 = T1 · (D2 / D1)^k */
export function riegel(t1: number, d1: number, d2: number, k = DEFAULT_RIEGEL_EXPONENT): number {
  return t1 * Math.pow(d2 / d1, k)
}

/** Jack Daniels' VDOT for a race performance (distance in m, time in s). */
export function vdotFromPerformance(distanceM: number, seconds: number): number {
  const minutes = seconds / 60
  const velocity = distanceM / minutes // m/min
  const vo2 = -4.6 + 0.182258 * velocity + 0.000104 * velocity * velocity
  const fraction =
    0.8 + 0.1894393 * Math.exp(-0.012778 * minutes) + 0.2989558 * Math.exp(-0.1932605 * minutes)
  return vo2 / fraction
}

/** Race time (s) that corresponds to a VDOT at the given distance. */
export function timeForVdot(vdot: number, distanceM: number): number {
  // VDOT decreases as time increases, so bisect on time.
  let lo = distanceM / 10 // 10 m/s
  let hi = distanceM / 0.5 // 0.5 m/s
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2
    if (vdotFromPerformance(distanceM, mid) > vdot) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

export function recencyWeight(ageDays: number): number {
  return Math.pow(0.5, Math.max(0, ageDays) / RECENCY_HALF_LIFE_DAYS)
}

/** Races close in distance to the target count more. */
export function proximityWeight(raceDistanceM: number, targetDistanceM: number): number {
  return 1 / (1 + 2 * Math.abs(Math.log(targetDistanceM / raceDistanceM)))
}

export interface FitPoint {
  distanceM: number
  seconds: number
  weight: number
}

/**
 * Personal Riegel exponent from a weighted log-log fit of time vs distance.
 * Needs at least two races whose distances differ by 50% or more.
 */
export function fitRiegelExponent(points: FitPoint[]): number | null {
  if (points.length < 2) return null
  const distances = points.map((p) => p.distanceM)
  if (Math.max(...distances) / Math.min(...distances) < 1.5) return null

  const sw = points.reduce((s, p) => s + p.weight, 0)
  if (sw <= 0) return null
  const mx = points.reduce((s, p) => s + p.weight * Math.log(p.distanceM), 0) / sw
  const my = points.reduce((s, p) => s + p.weight * Math.log(p.seconds), 0) / sw
  let num = 0
  let den = 0
  for (const p of points) {
    const dx = Math.log(p.distanceM) - mx
    num += p.weight * dx * (Math.log(p.seconds) - my)
    den += p.weight * dx * dx
  }
  if (den === 0) return null
  return Math.min(EXPONENT_MAX, Math.max(EXPONENT_MIN, num / den))
}

export type Confidence = 'high' | 'medium' | 'low'

export interface RaceBasis {
  activity: Activity
  ageDays: number
  raceSeconds: number
  raceVdot: number
  /** Share of this race in the prediction, 0–1. */
  share: number
  riegelSeconds: number
  vdotSeconds: number
}

export interface Prediction {
  target: Target
  seconds: number
  low: number
  high: number
  /** Seconds per km. */
  pace: number
  confidence: Confidence
  reasons: string[]
  basis: RaceBasis[]
}

export interface PredictionResult {
  anchor: Date
  windowStart: Date
  windowRaces: Activity[]
  exponent: number
  exponentFitted: boolean
  vdot: number | null
  predictions: Prediction[]
}

const CONFIDENCE_ORDER: Confidence[] = ['high', 'medium', 'low']
const RANGE_FLOOR: Record<Confidence, number> = { high: 0.01, medium: 0.02, low: 0.035 }

function downgrade(c: Confidence): Confidence {
  return CONFIDENCE_ORDER[Math.min(CONFIDENCE_ORDER.indexOf(c) + 1, CONFIDENCE_ORDER.length - 1)]
}

function formatKmShort(m: number): string {
  const km = m / 1000
  return `${Number.isInteger(Math.round(km * 10) / 10) ? km.toFixed(0) : km.toFixed(1)} km`
}

export interface PredictOptions {
  windowWeeks: number
  /** Defaults to the date of the latest activity. */
  anchor?: Date
}

export function predictRaces(
  allActivities: Activity[],
  races: Activity[],
  options: PredictOptions,
): PredictionResult {
  const latest = allActivities.reduce<Date | null>((max, a) => {
    const d = parseLocal(a.date)
    return !max || d > max ? d : max
  }, null)
  const anchor = endOfDay(options.anchor ?? latest ?? new Date())
  const windowStart = subDays(anchor, options.windowWeeks * 7)

  const windowRaces = races
    .filter((r) => {
      const d = parseLocal(r.date)
      return d >= windowStart && d <= anchor && r.distanceM >= MIN_RACE_DISTANCE_M && raceTime(r) > 0
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1))

  const items = windowRaces.map((activity) => {
    const ageDays = daysBetween(parseLocal(activity.date), anchor)
    const raceSeconds = raceTime(activity)
    return {
      activity,
      ageDays,
      raceSeconds,
      raceVdot: vdotFromPerformance(activity.distanceM, raceSeconds),
      recency: recencyWeight(ageDays),
    }
  })

  const fitted = fitRiegelExponent(
    items.map((i) => ({ distanceM: i.activity.distanceM, seconds: i.raceSeconds, weight: i.recency })),
  )
  const exponent = fitted ?? DEFAULT_RIEGEL_EXPONENT

  const recencySum = items.reduce((s, i) => s + i.recency, 0)
  const vdot =
    items.length > 0 ? items.reduce((s, i) => s + i.raceVdot * i.recency, 0) / recencySum : null

  // Longest run in the 8 weeks before the anchor, as an endurance check for long targets.
  const enduranceStart = subDays(anchor, 56)
  const longestRecentRunM = allActivities
    .filter((a) => {
      const d = parseLocal(a.date)
      return isRun(a) && d >= enduranceStart && d <= anchor
    })
    .reduce((max, a) => Math.max(max, a.distanceM), 0)

  const predictions: Prediction[] = items.length === 0 ? [] : TARGETS.map((target) => {
    const weighted = items.map((i) => {
      const weight = i.recency * proximityWeight(i.activity.distanceM, target.distanceM)
      return {
        ...i,
        weight,
        riegelSeconds: riegel(i.raceSeconds, i.activity.distanceM, target.distanceM, exponent),
        vdotSeconds: timeForVdot(i.raceVdot, target.distanceM),
      }
    })
    const totalWeight = weighted.reduce((s, w) => s + w.weight, 0)

    // Each race contributes two samples (Riegel and VDOT), each with half its weight.
    const samples = weighted.flatMap((w) => [
      { value: w.riegelSeconds, weight: w.weight / 2 },
      { value: w.vdotSeconds, weight: w.weight / 2 },
    ])
    const mean = samples.reduce((s, x) => s + x.value * x.weight, 0) / totalWeight
    const variance = samples.reduce((s, x) => s + x.weight * (x.value - mean) ** 2, 0) / totalWeight
    const sd = Math.sqrt(variance)

    // Confidence
    const reasons: string[] = []
    const nearest = weighted.reduce((best, w) =>
      Math.abs(Math.log(target.distanceM / w.activity.distanceM)) <
      Math.abs(Math.log(target.distanceM / best.activity.distanceM))
        ? w
        : best,
    )
    const nearestRatio = Math.abs(Math.log(target.distanceM / nearest.activity.distanceM))
    const newestAge = Math.min(...weighted.map((w) => w.ageDays))

    let confidence: Confidence
    if (nearestRatio <= Math.log(1.5)) {
      reasons.push(`You raced a similar distance (${formatKmShort(nearest.activity.distanceM)}).`)
      confidence = 'high'
    } else if (nearestRatio <= Math.log(2.5)) {
      reasons.push(
        `Closest race is ${formatKmShort(nearest.activity.distanceM)}, so this is extrapolated.`,
      )
      confidence = 'medium'
    } else {
      reasons.push(
        `No race near this distance (closest: ${formatKmShort(nearest.activity.distanceM)}).`,
      )
      confidence = 'low'
    }
    if (confidence === 'high' && items.length < 2) {
      reasons.push('Only one race in the window.')
      confidence = 'medium'
    }
    if (newestAge > 42) {
      reasons.push(`Your latest race was ${Math.round(newestAge / 7)} weeks ago.`)
      confidence = downgrade(confidence)
    }
    if (target.distanceM >= 15000) {
      if (longestRecentRunM < target.distanceM * 0.75) {
        reasons.push(
          `Longest run in the last 8 weeks is ${formatKmShort(longestRecentRunM)}. More long runs would make this more reliable.`,
        )
        confidence = downgrade(confidence)
      } else {
        reasons.push(`Long runs up to ${formatKmShort(longestRecentRunM)} support this distance.`)
      }
    }

    const halfRange = Math.max(sd, mean * RANGE_FLOOR[confidence])
    return {
      target,
      seconds: mean,
      low: mean - halfRange,
      high: mean + halfRange,
      pace: mean / (target.distanceM / 1000),
      confidence,
      reasons,
      basis: weighted
        .map((w) => ({
          activity: w.activity,
          ageDays: w.ageDays,
          raceSeconds: w.raceSeconds,
          raceVdot: w.raceVdot,
          share: w.weight / totalWeight,
          riegelSeconds: w.riegelSeconds,
          vdotSeconds: w.vdotSeconds,
        }))
        .sort((a, b) => b.share - a.share),
    }
  })

  return {
    anchor,
    windowStart,
    windowRaces,
    exponent,
    exponentFitted: fitted !== null,
    vdot,
    predictions,
  }
}
