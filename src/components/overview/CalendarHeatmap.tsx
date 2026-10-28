import { format, isSameMonth } from 'date-fns'
import { useEffect, useMemo, useRef, useState } from 'react'
import { buildHeatmap, heatmapLevel, HEATMAP_STEPS, type DayVolume } from '../../lib/daily'
import { formatHours, formatPace } from '../../lib/format'
import type { Activity } from '../../lib/types'
import { Card, CardHeader } from '../../md/Card'
import { cx } from '../../md/cx'

/** Rest day, then four shades of the primary colour. */
const LEVEL_CLASS = [
  'bg-on-surface/[0.06] dark:bg-on-surface/[0.10]',
  'bg-primary/30 dark:bg-primary/40',
  'bg-primary/50 dark:bg-primary/60',
  'bg-primary/75 dark:bg-primary/80',
  'bg-primary',
]

const WEEKDAYS = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun']

function dayLabel(day: DayVolume): string {
  const date = format(day.day, 'd MMM yyyy')
  if (day.runs === 0) return `${date}: rest day`
  const km = (day.distanceM / 1000).toFixed(1)
  return day.ids.length === 1
    ? `Open run on ${date}: ${km} km`
    : `${date}: ${km} km, ${day.runs} runs`
}

export function CalendarHeatmap({
  activities,
  today,
  onOpenActivity,
}: {
  activities: Activity[]
  today: Date
  onOpenActivity: (id: string) => void
}) {
  const data = useMemo(() => buildHeatmap(activities, today), [activities, today])
  const [selected, setSelected] = useState<DayVolume | null>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)

  // Start on the most recent week.
  useEffect(() => {
    const el = scrollerRef.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [data])

  const months = useMemo(() => {
    // Label a week when it starts a new month.
    return data.weeks.map((week, i) => {
      const first = week.find(Boolean)?.day
      const prev = data.weeks[i - 1]?.find(Boolean)?.day
      return first && (!prev || !isSameMonth(first, prev)) ? format(first, 'MMM') : ''
    })
  }, [data])

  const totalKm = data.totalM / 1000
  const active = data.activeDays
  const shown = selected

  return (
    <Card className="flex flex-col">
      <CardHeader
        title="Running calendar"
        subtitle={`${format(data.start, 'd MMM yyyy')} – ${format(data.end, 'd MMM yyyy')}`}
      />

      {/* Hovering the readout keeps the day selected so its View run button stays clickable. */}
      <div onMouseLeave={() => setSelected(null)}>
        {/* Fixed height: the grid must not move when the readout changes. */}
        <div className="min-h-[92px] px-4 pb-2 sm:min-h-[60px]" aria-live="polite">
          <div className="type-overline leading-6 text-on-surface/60">
            {shown ? format(shown.day, 'EEEE d MMMM yyyy') : 'Last 12 months'}
          </div>
          {shown ? (
            shown.runs === 0 ? (
              <p className="type-h6 text-on-surface/60">Rest day</p>
            ) : (
              <div className="flex flex-wrap items-baseline gap-x-4">
                <p className="type-h6 tabular-nums text-on-surface/87">
                  {(shown.distanceM / 1000).toFixed(2)} km
                </p>
                <p className="type-body2 tabular-nums text-on-surface/60">
                  {formatHours(shown.movingS)} · {formatPace(shown.movingS / (shown.distanceM / 1000))} /km
                  {shown.runs > 1 && ` · ${shown.runs} runs`}
                </p>
              </div>
            )
          ) : (
            <div className="flex flex-wrap items-baseline gap-x-4">
              <p className="type-h6 tabular-nums text-on-surface/87">{totalKm.toFixed(0)} km</p>
              <p className="type-body2 tabular-nums text-on-surface/60">
                {active} active days · {Math.round((active / data.days.length) * 100)}% of days
              </p>
            </div>
          )}
        </div>

        <div ref={scrollerRef} className="overflow-x-auto pb-1">
          {/* Padding sits inside the scroller so the labels can pin to the very edge. */}
          <div className="flex w-max gap-1.5 pr-4">
            {/* Weekday labels, pinned while the grid scrolls */}
            <div className="sticky left-0 z-10 flex shrink-0 flex-col gap-[3px] bg-surface-1 pt-5 pr-1 pl-4">
              {WEEKDAYS.map((d, i) => (
                <span
                  key={i}
                  className="type-caption flex h-3.5 items-center leading-none text-on-surface/60 sm:h-4"
                >
                  {d}
                </span>
              ))}
            </div>

            <div>
              {/* Month labels */}
              <div className="flex gap-[3px]">
                {months.map((label, i) => (
                  <span
                    key={i}
                    className="type-caption w-3.5 shrink-0 overflow-visible whitespace-nowrap text-on-surface/60 sm:w-4"
                  >
                    {label}
                  </span>
                ))}
              </div>
              {/* Week columns */}
              <div className="flex gap-[3px] pt-1">
                {data.weeks.map((week, w) => (
                  <div key={w} className="flex flex-col gap-[3px]">
                    {week.map((day, d) =>
                      day === null ? (
                        <span key={d} className="size-3.5 sm:size-4" />
                      ) : (
                        <button
                          key={d}
                          type="button"
                          aria-label={dayLabel(day)}
                          aria-pressed={selected?.date === day.date}
                          onMouseEnter={() => setSelected(day)}
                          onFocus={() => setSelected(day)}
                          onClick={() => {
                            setSelected(day)
                            if (day.ids.length === 1) onOpenActivity(day.ids[0])
                          }}
                          className={cx(
                            'size-3.5 rounded-[2px] transition-[outline] sm:size-4',
                            LEVEL_CLASS[heatmapLevel(day.distanceM)],
                            selected?.date === day.date && 'outline-2 outline-offset-1 outline-on-surface/60',
                            'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary',
                          )}
                        />
                      ),
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="type-caption flex items-center gap-1.5 px-4 pt-2 pb-4 text-on-surface/60">
        <span className="mr-auto">
          {HEATMAP_STEPS[0]} / {HEATMAP_STEPS[1]} / {HEATMAP_STEPS[2]} km steps
        </span>
        <span>Less</span>
        {LEVEL_CLASS.map((c, i) => (
          <span key={i} className={cx('size-3.5 rounded-[2px]', c)} />
        ))}
        <span>More</span>
      </div>
    </Card>
  )
}
