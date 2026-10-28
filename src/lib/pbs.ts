import { raceTime } from './races'
import type { Activity } from './types'

export interface PbDistance {
  key: string
  label: string
  distanceM: number
  /** Only shown when there is a result. */
  optional?: boolean
}

export const PB_DISTANCES: PbDistance[] = [
  { key: '5k', label: '5K', distanceM: 5000 },
  { key: '10k', label: '10K', distanceM: 10000 },
  { key: '15k', label: '15K', distanceM: 15000 },
  { key: 'hm', label: 'Half marathon', distanceM: 21097.5 },
  { key: 'm', label: 'Marathon', distanceM: 42195, optional: true },
]

/** A race counts for a distance if it is within ±3% of it. */
export const PB_TOLERANCE = 0.03

export interface PersonalBest {
  distance: PbDistance
  race: Activity | null
  seconds: number | null
  /** Number of races at this distance. */
  attempts: number
}

export function matchesDistance(distanceM: number, target: number): boolean {
  return Math.abs(distanceM - target) / target <= PB_TOLERANCE
}

/** Personal bests from races only. */
export function personalBests(races: Activity[]): PersonalBest[] {
  return PB_DISTANCES.map((distance) => {
    const matching = races.filter((r) => matchesDistance(r.distanceM, distance.distanceM))
    const best = matching.reduce<Activity | null>(
      (b, r) => (!b || raceTime(r) < raceTime(b) ? r : b),
      null,
    )
    return { distance, race: best, seconds: best ? raceTime(best) : null, attempts: matching.length }
  }).filter((pb) => !pb.distance.optional || pb.race)
}
