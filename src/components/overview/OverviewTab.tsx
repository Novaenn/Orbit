import { format } from 'date-fns'
import type { FitnessPoint } from '../../lib/fitness'
import type { Summary } from '../../lib/summary'
import type { Activity, DateRange, RangePreset } from '../../lib/types'
import { RangeChips } from '../RangeChips'
import { rangeLabel } from '../rangeOptions'
import { CalendarHeatmap } from './CalendarHeatmap'
import { FitnessChart } from './FitnessChart'
import { SummaryCards } from './SummaryCards'
import { WeeklyVolumeChart } from './WeeklyVolumeChart'

export function OverviewTab({
  activities,
  summary,
  fitness,
  range,
  preset,
  onPresetChange,
  today,
  dark,
  onOpenActivity,
}: {
  activities: Activity[]
  summary: Summary
  fitness: FitnessPoint[]
  range: DateRange
  preset: RangePreset
  onPresetChange: (p: RangePreset) => void
  today: Date
  dark: boolean
  onOpenActivity: (id: string) => void
}) {
  const todayKey = format(today, 'yyyy-MM-dd')
  const current = fitness.findLast((p) => p.date <= todayKey)
  const label = rangeLabel(preset)

  return (
    <>
      <SummaryCards summary={summary} current={current} today={today} />

      <section aria-labelledby="trends-title" className="mt-6 sm:mt-8">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="trends-title" className="type-h6 text-on-surface/87">
              Trends
            </h2>
            <p className="type-body2 text-on-surface/60">
              {format(range.start, 'd MMM yyyy')} – {format(range.end, 'd MMM yyyy')}
            </p>
          </div>
          <RangeChips value={preset} onChange={onPresetChange} />
        </div>

        <div className="grid grid-cols-1 items-start gap-4 sm:gap-6 xl:grid-cols-2">
          <WeeklyVolumeChart
            activities={activities}
            range={range}
            rangeLabel={label}
            today={today}
            dark={dark}
          />
          <FitnessChart series={fitness} range={range} today={today} dark={dark} />
        </div>

        <div className="mt-4 sm:mt-6">
          <CalendarHeatmap activities={activities} today={today} onOpenActivity={onOpenActivity} />
        </div>
      </section>
    </>
  )
}
