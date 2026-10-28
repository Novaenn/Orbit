import Papa from 'papaparse'
import type { Activity } from './types'

const REQUIRED_COLUMNS = ['id', 'start_date_local', 'type', 'distance', 'moving_time']

export class CsvFormatError extends Error {}

function num(value: string | undefined): number | null {
  if (value === undefined) return null
  const trimmed = value.trim()
  if (trimmed === '') return null
  const n = Number(trimmed)
  return Number.isFinite(n) ? n : null
}

/**
 * Watches report running cadence either per leg (about 75–95) or as total steps
 * (about 150–190). Anything low is doubled so the value is always steps per minute.
 */
export function toStepsPerMinute(cadence: number): number {
  return cadence > 0 && cadence < 110 ? cadence * 2 : cadence
}

export function parseActivitiesCsv(text: string): Activity[] {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.replace(/^\uFEFF/, '').trim(),
  })

  const columns = result.meta.fields ?? []
  const missing = REQUIRED_COLUMNS.filter((c) => !columns.includes(c))
  if (missing.length > 0) {
    throw new CsvFormatError(
      `This doesn't look like an intervals.icu activities export (missing columns: ${missing.join(', ')}).`,
    )
  }

  const activities: Activity[] = []
  for (const row of result.data) {
    const date = row.start_date_local?.trim()
    if (!date || !/^\d{4}-\d{2}-\d{2}/.test(date)) continue

    const movingS = num(row.moving_time) ?? 0
    const hrZoneSecs = [1, 2, 3, 4, 5, 6, 7].map((z) => num(row[`hr_z${z}_secs`]) ?? 0)
    const hasZones = hrZoneSecs.some((s) => s > 0)
    // Zone 7 has no column of its own: it runs from zone 6 up to the maximum heart rate.
    const bounds = [1, 2, 3, 4, 5, 6].map((z) => num(row[`hr_z${z}`]))
    const hrMax = num(row.hr_max)
    const hasBounds = bounds.every((b) => b !== null) && hrMax !== null
    const cadence = num(row.average_cadence)
    activities.push({
      id: row.id?.trim() || `${date}-${activities.length}`,
      date,
      name: row.name?.trim() || 'Untitled activity',
      type: row.type?.trim() || 'Other',
      distanceM: num(row.distance) ?? 0,
      movingS,
      elapsedS: num(row.elapsed_time) ?? movingS,
      elevationM: num(row.total_elevation_gain),
      avgHr: num(row.average_heartrate),
      maxHr: num(row.max_heartrate),
      avgSpeed: num(row.average_speed),
      maxSpeed: num(row.max_speed),
      hrZoneSecs: hasZones ? hrZoneSecs : null,
      hrZoneBounds: hasBounds ? [...(bounds as number[]), hrMax] : null,
      cadenceSpm: cadence === null ? null : toStepsPerMinute(cadence),
      calories: num(row.calories),
      intensity: num(row.icu_intensity),
      thresholdPaceMps: num(row.threshold_pace),
      hrRecovery: num(row.icu_hrrc),
      hrRecoveryFrom: num(row.icu_hrrc_start_bpm),
      gear: row.gear?.trim() || null,
      load: num(row.icu_training_load),
      fitness: num(row.icu_fitness),
      fatigue: num(row.icu_fatigue),
      raceFlag: row.race?.trim().toLowerCase() === 'true',
      description: row.description?.trim() ?? '',
    })
  }

  if (activities.length === 0) {
    throw new CsvFormatError('No activities found in this file.')
  }

  // Newest first, matching the intervals.icu export order.
  activities.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
  return activities
}
