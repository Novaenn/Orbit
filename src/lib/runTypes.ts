import { isRun } from './activities'
import { isAutoRace } from './races'
import type { Activity } from './types'

export type RunType = 'easy' | 'intervals' | 'tempo' | 'long' | 'race'

export const RUN_TYPES: { value: RunType; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'intervals', label: 'Intervals' },
  { value: 'tempo', label: 'Tempo' },
  { value: 'long', label: 'Long' },
  { value: 'race', label: 'Race' },
]

/** A run this long (or this many seconds) counts as a long run. */
export const LONG_DISTANCE_M = 14_000
export const LONG_DURATION_S = 75 * 60
/** Share of time in HR zone 4 and above that makes a run a hard session. */
export const HARD_ZONE4_SHARE = 0.4
/** Top speed vs average speed: above this the pace was uneven, so intervals rather than tempo. */
export const INTERVAL_SPEED_RATIO = 1.36

const KEYWORDS: { type: RunType; pattern: RegExp }[] = [
  // Warm-ups and cool-downs are easy running.
  { type: 'easy', pattern: /riscaldamento|warm[\s-]?up|cool[\s-]?down|defaticamento/i },
  { type: 'long', pattern: /\blung[ao]\b|\bLLP\b|long run/i },
  { type: 'intervals', pattern: /interval|ripetute|fartlek|\d+\s*x\s*\d+\s*(m|km)\b/i },
  { type: 'tempo', pattern: /\btempo\b|soglia|threshold/i },
  {
    type: 'easy',
    pattern: /\beasy\b|recovery|recupero|scarico|shakeout|tranquill|\bz2\b|\bbase\b|\blent[ao]\b/i,
  },
]

function isLongEffort(a: Activity): boolean {
  return a.distanceM >= LONG_DISTANCE_M || a.movingS >= LONG_DURATION_S
}

/**
 * Guess from the data when the name says nothing: time in high heart-rate zones
 * separates easy from hard, and pace variation separates intervals from tempo.
 */
function guessFromData(a: Activity): RunType {
  const zones = a.hrZoneSecs
  const total = zones?.reduce((s, v) => s + v, 0) ?? 0
  if (!zones || total === 0) return isLongEffort(a) ? 'long' : 'easy'

  const hardShare = zones.slice(3).reduce((s, v) => s + v, 0) / total
  if (hardShare < HARD_ZONE4_SHARE) return isLongEffort(a) ? 'long' : 'easy'

  const ratio = a.avgSpeed && a.maxSpeed ? a.maxSpeed / a.avgSpeed : 0
  return ratio >= INTERVAL_SPEED_RATIO ? 'intervals' : 'tempo'
}

/**
 * Run type for an activity: races first, then keywords in the name
 * (English and Italian), then a guess from heart rate and pace.
 * Returns null for anything that isn't a run.
 *
 * `raceIds` includes manual race tags; without it, automatic detection is used.
 */
export function classifyRun(a: Activity, raceIds?: ReadonlySet<string>): RunType | null {
  if (!isRun(a)) return null
  if (raceIds ? raceIds.has(a.id) : isAutoRace(a)) return 'race'
  return KEYWORDS.find((k) => k.pattern.test(a.name))?.type ?? guessFromData(a)
}

export function countRunTypes(activities: Activity[], raceIds?: ReadonlySet<string>): Map<RunType, number> {
  const counts = new Map<RunType, number>()
  for (const a of activities) {
    const type = classifyRun(a, raceIds)
    if (type) counts.set(type, (counts.get(type) ?? 0) + 1)
  }
  return counts
}
