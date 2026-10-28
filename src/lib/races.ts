import { isRun } from './activities'
import type { Activity, RaceOverrides } from './types'

const WARMUP_PATTERN = /riscaldamento|warm[\s-]?up|cool[\s-]?down|defaticamento/i

/** Automatic race detection: 🏁 in the name, the intervals.icu race flag, or "parkrun". */
export function isAutoRace(a: Activity): boolean {
  if (!isRun(a)) return false
  if (WARMUP_PATTERN.test(a.name)) return false
  return a.raceFlag || a.name.includes('🏁') || /parkrun/i.test(a.name)
}

export function isRace(a: Activity, overrides: RaceOverrides): boolean {
  if (!isRun(a)) return false
  return overrides[a.id] ?? isAutoRace(a)
}

export function getRaces(activities: Activity[], overrides: RaceOverrides): Activity[] {
  return activities.filter((a) => isRace(a, overrides))
}

/** Official race time: wall-clock (elapsed) time, falling back to moving time. */
export function raceTime(a: Activity): number {
  return a.elapsedS > 0 ? a.elapsedS : a.movingS
}
