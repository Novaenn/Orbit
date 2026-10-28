import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { isRun } from './activities'
import { dayKey } from './dates'
import { buildHeatmap, heatmapLevel } from './daily'
import { computedFitnessSeries, fitnessSeries } from './fitness'
import { zoneBreakdown } from './hrZones'
import { formatDuration, formatPace } from './format'
import { CsvFormatError, parseActivitiesCsv, toStepsPerMinute } from './parseCsv'
import { personalBests } from './pbs'
import {
  fitRiegelExponent,
  predictRaces,
  riegel,
  timeForVdot,
  vdotFromPerformance,
} from './predict'
import { getRaces, isAutoRace } from './races'
import { resolveRange } from './range'
import { classifyRun, countRunTypes } from './runTypes'
import { buildSummary, weeklyStreak } from './summary'
import { weeklyVolume } from './weekly'

const csv = readFileSync(resolve(__dirname, '../../i463508_activities.csv'), 'utf8')
const activities = parseActivitiesCsv(csv)
const races = getRaces(activities, {})
const TODAY = new Date(2026, 9, 28, 12, 0, 0) // Wed 28 Oct 2026

describe('parseActivitiesCsv', () => {
  it('parses every activity and strips the BOM from the first header', () => {
    expect(activities).toHaveLength(112)
    expect(activities.filter(isRun)).toHaveLength(99)
    expect(activities[0].id).toBe('20739439742')
    expect(activities[0].distanceM).toBeCloseTo(5006.6)
    expect(activities[0].movingS).toBe(1676)
  })

  it('rejects files that are not an intervals.icu export', () => {
    expect(() => parseActivitiesCsv('foo,bar\n1,2\n')).toThrow(CsvFormatError)
  })
})

describe('format', () => {
  it('formats durations and paces', () => {
    expect(formatDuration(1346)).toBe('22:26')
    expect(formatDuration(3645)).toBe('1:00:45')
    expect(formatPace(330)).toBe('5:30')
  })
})

describe('weeklyVolume', () => {
  const range = resolveRange('all', activities, TODAY)
  const weeks = weeklyVolume(activities, range)

  it('sums runs per Monday–Sunday week', () => {
    const w = weeks.find((x) => x.week === '2026-10-19')!
    expect(w.runs).toBe(4)
    expect(w.km).toBeCloseTo(5.0036 + 5.2589 + 5.0053 + 4.3872, 3)
    expect(w.hours).toBeCloseTo((1661 + 1584 + 1587 + 1164) / 3600, 5)
  })

  it('includes weeks without runs as zero', () => {
    const march = weeks.find((x) => x.week === '2026-03-09')!
    expect(march.km).toBe(0)
    expect(march.runs).toBe(0)
  })

  it('ignores rides, hikes and walks', () => {
    // Week of 27 Jul 2026 only has rides and a hike.
    expect(weeks.find((x) => x.week === '2026-07-27')!.km).toBe(0)
  })

  it('12w preset covers 12 weeks ending this week', () => {
    const w12 = weeklyVolume(activities, resolveRange('12w', activities, TODAY))
    expect(w12).toHaveLength(12)
    expect(w12.at(-1)!.week).toBe('2026-10-26')
  })
})

describe('races', () => {
  it('detects races by 🏁 and parkrun, excluding warm-ups', () => {
    expect(races.map((r) => r.date.slice(0, 10))).toEqual([
      '2026-10-24',
      '2026-10-10',
      '2026-10-04',
      '2026-09-27',
      '2026-07-04',
      '2026-06-02',
    ])
    const warmup = activities.find((a) => a.name.startsWith('Riscaldamento'))!
    expect(isAutoRace(warmup)).toBe(false)
  })

  it('respects manual overrides', () => {
    const tagged = getRaces(activities, { '20739439742': true, '20716990704': false })
    expect(tagged.some((r) => r.id === '20739439742')).toBe(true)
    expect(tagged.some((r) => r.id === '20716990704')).toBe(false)
  })
})

describe('prediction models', () => {
  it('VDOT matches Daniels’ tables (VDOT 50)', () => {
    expect(Math.abs(timeForVdot(50, 5000) - (19 * 60 + 57))).toBeLessThan(10)
    expect(Math.abs(timeForVdot(50, 10000) - (41 * 60 + 21))).toBeLessThan(15)
    expect(Math.abs(timeForVdot(50, 21097.5) - (91 * 60 + 35))).toBeLessThan(30)
    expect(vdotFromPerformance(5000, timeForVdot(43, 5000))).toBeCloseTo(43, 3)
  })

  it('Riegel scales with the exponent', () => {
    expect(riegel(1200, 5000, 10000, 1.06)).toBeCloseTo(1200 * Math.pow(2, 1.06))
  })

  it('fits a personal Riegel exponent', () => {
    const k = 1.08
    const points = [3000, 5000, 10000, 21097.5].map((d) => ({
      distanceM: d,
      seconds: 600 * Math.pow(d / 3000, k),
      weight: 1,
    }))
    expect(fitRiegelExponent(points)).toBeCloseTo(k, 6)
    expect(fitRiegelExponent(points.slice(0, 1))).toBeNull()
    expect(
      fitRiegelExponent([
        { distanceM: 5000, seconds: 1300, weight: 1 },
        { distanceM: 5100, seconds: 1340, weight: 1 },
      ]),
    ).toBeNull()
  })

  it('predicts plausible 5K / 10K / HM times from the sample data', () => {
    const result = predictRaces(activities, races, { windowWeeks: 12 })
    expect(result.windowRaces).toHaveLength(4)
    expect(result.exponentFitted).toBe(true)
    const [p5, p10, phm] = result.predictions
    expect(p5.seconds).toBeGreaterThan(21 * 60 + 30)
    expect(p5.seconds).toBeLessThan(23 * 60 + 30)
    expect(p10.seconds).toBeGreaterThan(45 * 60)
    expect(p10.seconds).toBeLessThan(49 * 60)
    expect(phm.seconds).toBeGreaterThan(100 * 60)
    expect(phm.seconds).toBeLessThan(110 * 60)
    expect(p5.confidence).toBe('high')
    expect(p5.low).toBeLessThan(p5.seconds)
    expect(p5.high).toBeGreaterThan(p5.seconds)
    expect(p5.basis.reduce((s, b) => s + b.share, 0)).toBeCloseTo(1)
  })

  it('returns no predictions when there are no races in the window', () => {
    const result = predictRaces(activities, [], { windowWeeks: 12 })
    expect(result.predictions).toHaveLength(0)
    expect(result.vdot).toBeNull()
  })
})

describe('fitnessSeries', () => {
  it('matches intervals.icu values on activity days and runs until today', () => {
    const series = fitnessSeries(activities, TODAY)
    const byDay = new Map(series.map((p) => [p.date, p]))
    for (const a of activities) {
      if (a.fitness === null) continue
      const p = byDay.get(a.date.slice(0, 10))!
      expect(p.fitness).toBeCloseTo(a.fitness, 5)
      expect(p.fatigue).toBeCloseTo(a.fatigue!, 5)
    }
    expect(series.at(-1)!.date).toBe('2026-10-28')
    // Rest days after the last activity decay toward zero.
    expect(series.at(-1)!.fatigue).toBeLessThan(series.at(-3)!.fatigue)
  })

  it('the load-based formula reproduces intervals.icu', () => {
    // intervals.icu skips the very first activity, so allow a short settling period.
    const byDay = new Map(computedFitnessSeries(activities, TODAY).map((p) => [p.date, p]))
    for (const a of activities) {
      if (a.fitness === null || a.date < '2026-01-01') continue
      const p = byDay.get(a.date.slice(0, 10))!
      expect(Math.abs(p.fitness - a.fitness)).toBeLessThan(0.5)
      expect(Math.abs(p.fatigue - a.fatigue!)).toBeLessThan(0.5)
    }
  })
})

describe('detail fields', () => {
  const first = activities[0]

  it('reads the fields the detail view shows', () => {
    expect(first.calories).toBe(332)
    expect(first.intensity).toBeCloseTo(86.7317, 3)
    expect(first.hrRecovery).toBe(21)
    expect(first.hrRecoveryFrom).toBe(169)
    expect(first.elevationM).toBeCloseTo(17.1, 1)
    expect(first.hrZoneBounds).toEqual([142, 158, 161, 167, 171, 176, 196])
    expect(activities.find((a) => a.gear)!.gear).toBe('ASICS Novablast 5')
  })

  it('reports cadence as steps per minute', () => {
    // The watch records one leg (86), so it is doubled.
    expect(first.cadenceSpm).toBeCloseTo(172.87, 1)
    expect(toStepsPerMinute(86)).toBe(172)
    // A value already in steps per minute is left alone.
    expect(toStepsPerMinute(170)).toBe(170)
    expect(toStepsPerMinute(0)).toBe(0)
  })

  it('breaks an activity down into heart-rate zones with bpm ranges', () => {
    const zones = zoneBreakdown(first)!
    expect(zones).toHaveLength(7)
    expect(zones.map((z) => z.seconds)).toEqual([50, 1375, 104, 106, 31, 0, 0])
    expect(zones[0].range).toBe('≤ 142')
    expect(zones[1].range).toBe('143–158')
    expect(zones[6].range).toBe('177–196')
    expect(zones.reduce((s, z) => s + z.share, 0)).toBeCloseTo(1)
    expect(zones[1].share).toBeCloseTo(1375 / 1666, 4)
  })

  it('returns nothing for activities without heart rate', () => {
    expect(zoneBreakdown({ ...first, hrZoneSecs: null })).toBeNull()
  })
})

describe('buildHeatmap', () => {
  const heatmap = buildHeatmap(activities, TODAY)

  it('covers the last 12 months in whole weeks', () => {
    expect(heatmap.start.getDay()).toBe(1) // Monday
    // The first run is 23 Nov 2025, later than a year ago, so the grid starts from its week.
    expect(dayKey(heatmap.start)).toBe('2025-11-17')
    expect(dayKey(heatmap.end)).toBe('2026-10-28')
    expect(heatmap.weeks).toHaveLength(50)
    expect(heatmap.weeks.every((w) => w.length === 7)).toBe(true)
  })

  it('never starts more than a year back', () => {
    // A year before 1 Jun 2027 is 1 Jun 2026, which is already a Monday.
    const recent = buildHeatmap(activities, new Date(2027, 5, 1))
    expect(dayKey(recent.start)).toBe('2026-06-01')
  })

  it('leaves days after today empty', () => {
    const lastWeek = heatmap.weeks.at(-1)!
    // 28 Oct 2026 is a Wednesday, so Thursday onwards is not shown.
    expect(lastWeek.slice(0, 3).every((d) => d !== null)).toBe(true)
    expect(lastWeek.slice(3).every((d) => d === null)).toBe(true)
  })

  it('adds up runs per day', () => {
    const day = heatmap.days.find((d) => d.date === '2026-10-18')!
    expect(day.runs).toBe(1)
    expect(day.distanceM).toBeCloseTo(18003.1)
    expect(day.ids).toEqual(['20631971489'])
    // Four runs on the same day are combined.
    const busiest = heatmap.days.find((d) => d.date === '2026-02-01')!
    expect(busiest.runs).toBe(4)
    expect(busiest.distanceM).toBeCloseTo(1.42 * 1000 + 3.31 * 1000 + 1.02 * 1000 + 1.09 * 1000, 0)
    expect(heatmap.days.find((d) => d.date === '2026-03-09')!.runs).toBe(0)
  })

  it('counts runs only', () => {
    // 2 Aug 2026 is a ride, 28 Jul 2026 a hike and rides.
    expect(heatmap.days.find((d) => d.date === '2026-08-02')!.runs).toBe(0)
    expect(heatmap.days.find((d) => d.date === '2026-07-28')!.runs).toBe(0)
  })

  it('summarises the period', () => {
    expect(heatmap.activeDays).toBe(93)
    expect(heatmap.totalM / 1000).toBeCloseTo(650.5, 0)
  })

  it('shades by distance', () => {
    expect(heatmapLevel(0)).toBe(0)
    expect(heatmapLevel(3_000)).toBe(1)
    expect(heatmapLevel(4_000)).toBe(2)
    expect(heatmapLevel(9_000)).toBe(3)
    expect(heatmapLevel(18_000)).toBe(4)
  })
})

describe('classifyRun', () => {
  const byName = (part: string) => activities.find((a) => a.name.includes(part))!

  it('uses keywords in the name, in English and Italian', () => {
    expect(classifyRun(byName('W13D4: Palocco Lunga 18km'))).toBe('long')
    expect(classifyRun(byName('W1D4: LUNGA LENTA MARE'))).toBe('long')
    expect(classifyRun(byName('LLP - Lunga Lenta Palocco'))).toBe('long')
    expect(classifyRun(byName('Long run Z2'))).toBe('long')
    expect(classifyRun(byName('W14D2: Malafede Intervals 4x1000m'))).toBe('intervals')
    expect(classifyRun(byName('Fartleks 4km@5:20'))).toBe('intervals')
    expect(classifyRun(byName('W3D12: Malafede Intervals 5x500m'))).toBe('intervals')
    expect(classifyRun(byName('W13D3: Madonnetta Tempo 25min'))).toBe('tempo')
    expect(classifyRun(byName('W15D1: Malafede Easy 5km'))).toBe('easy')
    expect(classifyRun(byName('W11D2: Malafede Scarico 3km'))).toBe('easy')
    expect(classifyRun(byName('W4D12: Malafede Shakeout'))).toBe('easy')
  })

  it('counts intervals first for mixed sessions', () => {
    expect(classifyRun(byName('Dragoncello Mix 2x15min@5:00 + 2x400m'))).toBe('intervals')
  })

  it('treats warm-ups as easy and never as races', () => {
    expect(classifyRun(byName('Riscaldamento Pre-Cardio Race'))).toBe('easy')
  })

  it('marks races, including manual tags', () => {
    expect(classifyRun(byName('🏁 Ostia Night Run'))).toBe('race')
    expect(classifyRun(byName('5️⃣ Caffarella Parkrun'))).toBe('race')
    const tempo = byName('W13D3: Madonnetta Tempo 25min')
    expect(classifyRun(tempo, new Set([tempo.id]))).toBe('race')
  })

  it('ignores activities that are not runs', () => {
    expect(classifyRun(activities.find((a) => a.type === 'Ride')!)).toBeNull()
    expect(classifyRun(activities.find((a) => a.type === 'Hike')!)).toBeNull()
  })

  it('falls back to heart rate and pace when the name says nothing', () => {
    // Little time in high zones -> easy.
    expect(classifyRun(byName('10k Palocco'))).toBe('easy') // 30% in Z4+
    expect(classifyRun(byName('Short run pre-calcetto'))).toBe('easy') // 3% in Z4+
    // Hard, with uneven pace -> intervals.
    expect(classifyRun(byName('Lunch Run con diluvio'))).toBe('intervals') // 42% in Z4+, 2.08x
    expect(classifyRun(byName('Malafede pt.2'))).toBe('intervals') // 95% in Z4+, 1.37x
    // Hard, but steady pace -> tempo.
    expect(classifyRun(byName('Afternoon Run'))).toBe('tempo') // 71% in Z4+, 1.33x
  })

  it('uses distance when there is no heart rate', () => {
    const noHr = { ...byName('10k Palocco'), hrZoneSecs: null }
    expect(classifyRun(noHr)).toBe('easy')
    expect(classifyRun({ ...noHr, distanceM: 20000 })).toBe('long')
    expect(classifyRun({ ...noHr, movingS: 80 * 60 })).toBe('long')
  })

  it('classifies every run in the sample file', () => {
    const counts = countRunTypes(activities)
    expect(Object.fromEntries(counts)).toEqual({ easy: 40, intervals: 27, tempo: 15, long: 11, race: 6 })
    expect([...counts.values()].reduce((s, n) => s + n, 0)).toBe(99)
  })
})

describe('personalBests', () => {
  it('uses races within ±3% of the distance', () => {
    const pbs = personalBests(races)
    const fiveK = pbs.find((p) => p.distance.key === '5k')!
    expect(fiveK.race!.name).toContain('Caffarella Parkrun #2')
    expect(fiveK.seconds).toBe(1346)
    expect(fiveK.attempts).toBe(2)
    expect(pbs.find((p) => p.distance.key === '10k')!.race!.name).toContain('Corriamo al Cavaliere')
    expect(pbs.find((p) => p.distance.key === 'hm')!.race).toBeNull()
    expect(pbs.some((p) => p.distance.key === 'm')).toBe(false)
  })
})

describe('summary', () => {
  it('computes weekly totals and streak relative to today', () => {
    const s = buildSummary(activities, TODAY)
    expect(s.thisWeek.runs).toBe(1)
    expect(s.lastWeek.runs).toBe(4)
    expect(s.longestRun!.distanceM).toBeCloseTo(18003.1)
    expect(weeklyStreak(activities, TODAY)).toBe(11)
  })
})
