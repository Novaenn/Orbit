import { format } from 'date-fns'
import type { Activity, DateRange, RangePreset } from '../../lib/types'
import { RangeChips } from '../RangeChips'
import { rangeLabel } from '../rangeOptions'
import { CadenceTrendCard } from './CadenceTrendCard'
import { FitnessProgressionCard } from './FitnessProgressionCard'
import { TrainingPatternsCard } from './TrainingPatternsCard'
import { ZoneDistributionCard } from './ZoneDistributionCard'

export function InsightsTab({
  activities,
  races,
  raceIds,
  range,
  preset,
  onPresetChange,
  today,
  dark,
}: {
  activities: Activity[]
  races: Activity[]
  raceIds: ReadonlySet<string>
  range: DateRange
  preset: RangePreset
  onPresetChange: (preset: RangePreset) => void
  today: Date
  dark: boolean
}) {
  const label = rangeLabel(preset)

  return (
    <section aria-labelledby="insights-title">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="insights-title" className="type-h6 text-on-surface/87">
            Training insights
          </h2>
          <p className="type-body2 text-on-surface/60">
            {format(range.start, 'd MMM yyyy')} – {format(range.end, 'd MMM yyyy')}
          </p>
        </div>
        <RangeChips value={preset} onChange={onPresetChange} />
      </div>

      <div className="grid grid-cols-1 items-start gap-4 sm:gap-6 xl:grid-cols-2">
        <FitnessProgressionCard
          activities={activities}
          races={races}
          raceIds={raceIds}
          range={range}
          rangeLabel={label}
          dark={dark}
        />
        <ZoneDistributionCard
          activities={activities}
          range={range}
          rangeLabel={label}
          today={today}
          dark={dark}
        />
        <CadenceTrendCard activities={activities} range={range} rangeLabel={label} dark={dark} />
        <TrainingPatternsCard activities={activities} range={range} rangeLabel={label} dark={dark} />
      </div>
    </section>
  )
}
