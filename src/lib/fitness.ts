import { addDays, startOfDay } from 'date-fns'
import { dayKey, parseLocal } from './dates'
import type { Activity } from './types'

export const FITNESS_DAYS = 42
export const FATIGUE_DAYS = 7

export interface FitnessPoint {
  date: string
  /** Start of the day in ms, for the chart's time axis. */
  ts: number
  fitness: number
  fatigue: number
  form: number
  load: number
}

/**
 * Daily Fitness (CTL) and Fatigue (ATL) as exponentially weighted averages of
 * training load, the way intervals.icu calculates them. Form = Fitness − Fatigue.
 * Uses every activity type, like intervals.icu does.
 *
 * On days where the export includes intervals.icu's own end-of-day values, those
 * are used directly so the chart matches intervals.icu; days in between are calculated.
 */
export function fitnessSeries(activities: Activity[], until: Date = new Date()): FitnessPoint[] {
  if (activities.length === 0) return []

  const loads = new Map<string, number>()
  const icuValues = new Map<string, { fitness: number; fatigue: number }>()
  for (const a of activities) {
    const key = a.date.slice(0, 10)
    loads.set(key, (loads.get(key) ?? 0) + (a.load ?? 0))
    if (a.fitness !== null && a.fatigue !== null) {
      icuValues.set(key, { fitness: a.fitness, fatigue: a.fatigue })
    }
  }

  const dates = activities.map((a) => parseLocal(a.date).getTime())
  const first = startOfDay(new Date(Math.min(...dates)))
  const last = startOfDay(new Date(Math.max(...dates)))
  const end = startOfDay(until > last ? until : last)

  const kFitness = 1 - Math.exp(-1 / FITNESS_DAYS)
  const kFatigue = 1 - Math.exp(-1 / FATIGUE_DAYS)

  const series: FitnessPoint[] = []
  let fitness = 0
  let fatigue = 0
  for (let d = first; d <= end; d = addDays(d, 1)) {
    const key = dayKey(d)
    const load = loads.get(key) ?? 0
    const icu = icuValues.get(key)
    if (icu) {
      fitness = icu.fitness
      fatigue = icu.fatigue
    } else {
      fitness += (load - fitness) * kFitness
      fatigue += (load - fatigue) * kFatigue
    }
    series.push({ date: key, ts: d.getTime(), fitness, fatigue, form: fitness - fatigue, load })
  }
  return series
}

/** Fitness/Fatigue calculated purely from training load (no intervals.icu values). */
export function computedFitnessSeries(activities: Activity[], until?: Date): FitnessPoint[] {
  return fitnessSeries(
    activities.map((a) => ({ ...a, fitness: null, fatigue: null })),
    until,
  )
}

export interface FormZone {
  label: string
  description: string
  tone: 'blue' | 'green' | 'gray' | 'amber' | 'red'
}

export function formZone(form: number): FormZone {
  if (form > 20) return { label: 'Transition', description: 'Very fresh, but losing fitness', tone: 'blue' }
  if (form > 5) return { label: 'Fresh', description: 'Rested, good for racing', tone: 'green' }
  if (form >= -10) return { label: 'Neutral', description: 'Maintaining fitness', tone: 'gray' }
  if (form >= -30) return { label: 'Productive', description: 'Building fitness', tone: 'amber' }
  return { label: 'High risk', description: 'Very fatigued, consider resting', tone: 'red' }
}
