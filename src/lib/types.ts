export interface Activity {
  id: string
  /** Local start time as written in the CSV, e.g. "2026-10-26T17:14:29". */
  date: string
  name: string
  type: string
  distanceM: number
  movingS: number
  elapsedS: number
  elevationM: number | null
  avgHr: number | null
  maxHr: number | null
  /** Average speed in m/s. */
  avgSpeed: number | null
  /** Top speed in m/s. */
  maxSpeed: number | null
  /** Seconds in heart-rate zones 1–7, or null when the activity has no heart rate. */
  hrZoneSecs: number[] | null
  /** Upper bpm limit of each heart-rate zone 1–7. */
  hrZoneBounds: number[] | null
  /** Steps per minute, already doubled when the device reports one leg. */
  cadenceSpm: number | null
  calories: number | null
  /** Effort as a percentage of threshold pace. */
  intensity: number | null
  /** intervals.icu's threshold pace estimate in m/s, or null. */
  thresholdPaceMps: number | null
  /** Heart-rate drop in the first minute after stopping. */
  hrRecovery: number | null
  /** Heart rate when that recovery measurement started. */
  hrRecoveryFrom: number | null
  gear: string | null
  load: number | null
  fitness: number | null
  fatigue: number | null
  raceFlag: boolean
  description: string
}

/** Manual race tagging: activity id -> true (is a race) / false (not a race). */
export type RaceOverrides = Record<string, boolean>

export interface DataMeta {
  fileName: string
  importedAt: string
  /** Set by the importer; older saved data has no version and lacks some fields. */
  version?: number
}

export type RangePreset = '12w' | '6m' | '1y' | 'all'

export interface DateRange {
  start: Date
  end: Date
}
