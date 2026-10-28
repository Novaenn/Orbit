import type { RangePreset } from '../lib/types'
import { ChoiceChips } from '../md/Chips'
import { RANGE_CHIPS } from './rangeOptions'

/** The time-range chips shared by Overview and Insights. */
export function RangeChips({
  value,
  onChange,
}: {
  value: RangePreset
  onChange: (preset: RangePreset) => void
}) {
  return <ChoiceChips label="Time range" value={value} onChange={onChange} options={RANGE_CHIPS} />
}
