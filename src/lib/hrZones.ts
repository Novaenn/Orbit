import type { Activity } from './types'

export const ZONE_COUNT = 7

export const ZONE_NAMES = ['Z1', 'Z2', 'Z3', 'Z4', 'Z5', 'Z6', 'Z7']

export interface ZoneSlice {
  /** 0-based zone index. */
  index: number
  name: string
  seconds: number
  /** Share of the activity's zone time, 0–1. */
  share: number
  /** bpm range, e.g. "143–158". Null when the file has no zone limits. */
  range: string | null
}

/** Time spent in each heart-rate zone, with the bpm range of each zone. */
export function zoneBreakdown(activity: Activity): ZoneSlice[] | null {
  const secs = activity.hrZoneSecs
  if (!secs) return null
  const total = secs.reduce((s, v) => s + v, 0)
  if (total === 0) return null

  const bounds = activity.hrZoneBounds
  return secs.map((seconds, index) => ({
    index,
    name: ZONE_NAMES[index],
    seconds,
    share: seconds / total,
    range: bounds ? zoneRange(bounds, index) : null,
  }))
}

export function zoneRange(bounds: number[], index: number): string {
  const upper = bounds[index]
  const lower = index === 0 ? 0 : bounds[index - 1] + 1
  return index === 0 ? `≤ ${upper}` : `${lower}–${upper}`
}

/** Zone limits from the most recent activity that has them. */
export function latestZoneBounds(activities: Activity[]): number[] | null {
  return activities.find((a) => a.hrZoneBounds)?.hrZoneBounds ?? null
}
