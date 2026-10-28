import type { RangePreset } from '../lib/types'

export const RANGE_CHIPS: { value: RangePreset; label: string; long: string }[] = [
  { value: '12w', label: '12 weeks', long: 'Last 12 weeks' },
  { value: '6m', label: '6 months', long: 'Last 6 months' },
  { value: '1y', label: '1 year', long: 'Last year' },
  { value: 'all', label: 'All time', long: 'All time' },
]

export function rangeLabel(preset: RangePreset): string {
  return RANGE_CHIPS.find((c) => c.value === preset)!.long
}
