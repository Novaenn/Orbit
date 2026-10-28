import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { addDays } from 'date-fns'
import {
  cadenceSeries,
  efficiencyMetersPerBeat,
  efficiencySeries,
  hourPattern,
  relativeChange,
  rollingAverage,
  thresholdPaceSteps,
  vdotSeries,
  weekdayPattern,
  weeklyZoneTotals,
  zoneShare,
} from './insights'
import { parseActivitiesCsv } from './parseCsv'
import { getRaces } from './races'
import { resolveRange } from './range'
import type { Activity } from './types'

const csv = readFileSync(resolve(__dirname, '../../i463508_activities.csv'), 'utf8')
const activities = parseActivitiesCsv(csv)
const races = getRaces(activities, {})
const TODAY = new Date(2026, 9, 28, 12, 0, 0) // Wed 28 Oct 2026
const allRange = resolveRange('all', activities, TODAY)
const noOverrides = new Set<string>()

function activity(overrides: Partial<Activity>): Activity {
  return {
    id: '1',
    date: '2026-01-01T08:00:00',
    name: 'Run',
    type: 'Run',
    distanceM: 10_000,
    movingS: 3_000,
    elapsedS: 3_000,
    elevationM: null,
    avgHr: 150,
    maxHr: 180,
    avgSpeed: 3.333,
    maxSpeed: 4,
    hrZoneSecs: null,
    hrZoneBounds: null,
    cadenceSpm: 170,
    calories: null,
    intensity: 85,
    thresholdPaceMps: 3.2,
    hrRecovery: null,
    hrRecoveryFrom: null,
    gear: null,
    load: null,
    fitness: null,
    fatigue: null,
    raceFlag: false,
    description: '',
    ...overrides,
  }
}

describe('rollingAverage', () => {
  it('uses a trailing window and includes the point itself', () => {
    const start = new Date(2026, 0, 1)
    const values = [10, 20, 30, 40, 50, 60]
    const points = values.map((value, i) => ({
      date: `2026-01-${String(i * 7 + 1).padStart(2, '0')}`,
      ts: addDays(start, i * 7).getTime(),
      value,
    }))

    const rolled = rollingAverage(points, 28)
    expect(rolled.map((p) => p.average)).toEqual([10, 15, 20, 25, 35, 45])
  })

  it('sorts oldest first', () => {
    const points = [
      { date: '2026-01-08', ts: 7, value: 20 },
      { date: '2026-01-01', ts: 0, value: 10 },
    ]
    expect(rollingAverage(points, 28).map((p) => p.value)).toEqual([10, 20])
  })
})

describe('efficiency', () => {
  it('calculates metres per heartbeat', () => {
    expect(efficiencyMetersPerBeat(activity({}))).toBeCloseTo(1.3333, 4)
    expect(efficiencyMetersPerBeat(activity({ avgHr: null }))).toBeNull()
    expect(efficiencyMetersPerBeat(activity({ movingS: 0 }))).toBeNull()
    expect(efficiencyMetersPerBeat(activity({ distanceM: 0 }))).toBeNull()
  })

  it('uses easy and long runs with heart rate from the sample file', () => {
    const points = efficiencySeries(activities, allRange, noOverrides)
    expect(points).toHaveLength(47)
    expect(points[0].date).toBe('2025-12-22')
    expect(points.at(-1)!.date).toBe('2026-10-26')
    expect(points.at(-1)!.value).toBeCloseTo(1.1715, 4)
    expect(relativeChange(points.map((p) => p.value))).toBeCloseTo(0.124, 3)
  })

  it('excludes hard sessions and runs without heart rate', () => {
    const points = efficiencySeries(
      [
        activity({ id: 'easy' }),
        activity({ id: 'tempo', name: 'Tempo run' }),
        activity({ id: 'intervals', name: 'Intervals 5x1000m' }),
        activity({ id: 'race', name: '🏁 Race' }),
        activity({ id: 'no-hr', avgHr: null }),
      ],
      allRange,
    )
    expect(points.map((p) => p.activity.id)).toEqual(['easy'])
  })
})

describe('cadence trend', () => {
  it('uses every run with cadence and adds a 4-week average', () => {
    const points = cadenceSeries(activities, allRange)
    expect(points).toHaveLength(98)
    expect(points[0].value).toBeCloseTo(155.3, 1)
    expect(points.at(-1)!.value).toBeCloseTo(172.9, 1)
    expect(points.at(-1)!.average).toBeCloseTo(173.7, 1)
  })
})

describe('weeklyZoneTotals', () => {
  const weeks = weeklyZoneTotals(activities, allRange)

  it('aggregates zone seconds per Monday–Sunday week', () => {
    expect(weeks).toHaveLength(50)
    const week = weeks.find((w) => w.week === '2026-10-19')!
    expect(week.runs).toBe(4)
    expect(week.seconds).toEqual([497, 3260, 409, 1015, 441, 234, 97])
    expect(week.totalS).toBe(5953)
  })

  it('includes weeks without zone data as zeros', () => {
    const week = weeks.find((w) => w.week === '2026-03-09')!
    expect(week.totalS).toBe(0)
    expect(week.runs).toBe(0)
    expect(week.seconds).toEqual([0, 0, 0, 0, 0, 0, 0])
  })

  it('puts 59% of the sample time in Z1–Z2', () => {
    const total = weeks.reduce(
      (sum, w) => sum.map((v, i) => v + w.seconds[i]),
      Array<number>(7).fill(0),
    )
    expect(zoneShare(total, 0, 1)).toBeCloseTo(0.5934, 3)
    expect(zoneShare(total, 2, 3)).toBeCloseTo(0.2657, 3)
    expect(zoneShare(total, 4, 6)).toBeCloseTo(0.1409, 3)
    expect(zoneShare([0, 0, 0, 0, 0, 0, 0], 0, 1)).toBe(0)
  })
})

describe('training patterns', () => {
  const weekdays = weekdayPattern(activities, allRange)
  const hours = hourPattern(activities, allRange)

  it('counts runs per weekday, Monday first', () => {
    expect(weekdays.map((b) => b.runs)).toEqual([23, 1, 22, 3, 21, 11, 18])
    expect(weekdays[0].label).toBe('Monday')
    expect(weekdays.reduce((s, b) => s + b.runs, 0)).toBe(99)
    expect(weekdays[0].pace).toBeGreaterThan(0)
  })

  it('counts runs per start hour', () => {
    expect(hours).toHaveLength(24)
    expect(hours[18].runs).toBe(28)
    expect(hours[8].runs + hours[9].runs).toBe(23)
    expect(hours.reduce((s, b) => s + b.runs, 0)).toBe(99)
    expect(hours[18].label).toBe('18:00')
  })

  it('adds distance, time and pace to each bucket', () => {
    const friday = weekdays[4]
    expect(friday.runs).toBe(21)
    expect(friday.distanceM).toBeGreaterThan(100_000)
    expect(friday.pace).toBeCloseTo(friday.movingS / (friday.distanceM / 1000), 5)
  })
})

describe('threshold pace', () => {
  it('steps through the threshold values in the sample file', () => {
    const steps = thresholdPaceSteps(activities, allRange)
    expect(steps.map((s) => s.date)).toEqual([
      '2025-11-23',
      '2026-05-10',
      '2026-10-07',
      '2026-10-28',
    ])
    expect(steps.map((s) => Math.round(s.pace))).toEqual([330, 310, 290, 290])
  })

  it('starts from the last value before the range', () => {
    const steps = thresholdPaceSteps(activities, resolveRange('12w', activities, TODAY))
    expect(Math.round(steps[0].pace)).toBe(310)
    expect(Math.round(steps.at(-1)!.pace)).toBe(290)
  })
})

describe('VDOT series', () => {
  it('has one point per race, oldest first', () => {
    const points = vdotSeries(races, allRange)
    expect(points).toHaveLength(6)
    expect(points.map((p) => p.value.toFixed(1))).toEqual([
      '36.9',
      '40.6',
      '41.4',
      '42.0',
      '44.3',
      '43.5',
    ])
  })
})
