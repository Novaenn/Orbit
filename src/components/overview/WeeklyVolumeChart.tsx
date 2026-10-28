import { format } from 'date-fns'
import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Rectangle,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type BarShapeProps,
} from 'recharts'
import { parseLocal, weekKey } from '../../lib/dates'
import { formatHours, formatPace } from '../../lib/format'
import type { Activity, DateRange } from '../../lib/types'
import { weeklyVolume, type WeekVolume } from '../../lib/weekly'
import { Card, CardHeader } from '../../md/Card'
import { cx } from '../../md/cx'
import { useIsCompact, useMediaQuery } from '../../md/layout'
import { ToggleButtonGroup } from '../../md/ToggleButtonGroup'
import { ActivePointBridge } from '../charts/ActivePointBridge'
import { chartTheme } from '../charts/chartTheme'
import { ChartReadout } from './ChartReadout'

type Unit = 'km' | 'hours'

const fmtValue = (v: number, unit: Unit) => (unit === 'km' ? `${v.toFixed(1)} km` : formatHours(v * 3600))

export function WeeklyVolumeChart({
  activities,
  range,
  rangeLabel,
  today,
  dark,
}: {
  activities: Activity[]
  range: DateRange
  rangeLabel: string
  today: Date
  dark: boolean
}) {
  const [unit, setUnit] = useState<Unit>('km')
  const [selected, setSelected] = useState<WeekVolume | null>(null)
  const compact = useIsCompact()
  const canHover = useMediaQuery('(hover: hover)')
  const theme = chartTheme(dark)

  const weeks = useMemo(() => weeklyVolume(activities, range), [activities, range])
  const currentWeek = weekKey(today)

  const stats = useMemo(() => {
    const val = (w: WeekVolume) => (unit === 'km' ? w.km : w.hours)
    const complete = weeks.filter((w) => w.week !== currentWeek)
    const total = weeks.reduce((s, w) => s + val(w), 0)
    const average = complete.length ? complete.reduce((s, w) => s + val(w), 0) / complete.length : 0
    const peak = weeks.reduce((best, w) => Math.max(best, val(w)), 0)
    const runs = weeks.reduce((s, w) => s + w.runs, 0)
    return { total, average, peak, runs }
  }, [weeks, unit, currentWeek])

  const readout = selected
    ? {
        heading: (
          <>
            Week of {format(selected.weekStart, 'd MMM yyyy')}
            {selected.week === currentWeek && ' · so far'}
          </>
        ),
        values: [
          { label: 'Distance', value: `${selected.km.toFixed(1)} km` },
          { label: 'Time', value: formatHours(selected.movingS) },
          { label: 'Runs', value: selected.runs },
          { label: 'Pace /km', value: formatPace(selected.pace) },
        ],
      }
    : {
        heading: rangeLabel,
        values: [
          { label: 'Total', value: fmtValue(stats.total, unit) },
          { label: 'Avg / week', value: fmtValue(stats.average, unit) },
          { label: 'Peak week', value: fmtValue(stats.peak, unit) },
          { label: 'Runs', value: stats.runs },
        ],
      }

  return (
    <Card className="flex flex-col">
      <CardHeader
        title="Weekly volume"
        subtitle="Running only · Monday to Sunday"
        action={
          <ToggleButtonGroup
            label="Unit"
            value={unit}
            onChange={setUnit}
            options={[
              { value: 'km', label: 'Km' },
              { value: 'hours', label: 'Hours' },
            ]}
          />
        }
      />

      <ChartReadout heading={readout.heading} values={readout.values} />

      <div className="flex flex-col">
        <div className="h-56 px-2 sm:h-64 lg:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={weeks}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              onMouseLeave={() => setSelected(null)}
            >
              <CartesianGrid vertical={false} stroke={theme.grid} />
              <XAxis
                dataKey="week"
                tickFormatter={(w: string) => format(parseLocal(w), 'd MMM')}
                interval="preserveStartEnd"
                minTickGap={compact ? 20 : 12}
                tick={{ fontSize: 12, fill: theme.axis }}
                tickLine={false}
                axisLine={{ stroke: theme.grid }}
              />
              <YAxis
                width={compact ? 32 : 40}
                tick={{ fontSize: 12, fill: theme.axis }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                tickFormatter={(v: number) => (unit === 'hours' ? `${v}h` : `${v}`)}
              />
              <Tooltip
                cursor={{ fill: theme.cursor }}
                content={(props) => (
                  <ActivePointBridge<WeekVolume> active={props.active} payload={props.payload} onChange={setSelected} />
                )}
              />
              {stats.average > 0 && (
                <ReferenceLine
                  y={stats.average}
                  stroke={theme.average}
                  strokeDasharray="4 4"
                  strokeWidth={1}
                  ifOverflow="extendDomain"
                />
              )}
              <Bar
                dataKey={unit === 'km' ? 'km' : 'hours'}
                radius={[2, 2, 0, 0]}
                maxBarSize={40}
                isAnimationActive={false}
                shape={(props: BarShapeProps) => {
                  const w = props.payload as WeekVolume
                  const fill =
                    selected?.week === w.week
                      ? theme.volumeSelected
                      : w.week === currentWeek
                        ? theme.volumeCurrent
                        : theme.volume
                  return <Rectangle {...props} fill={fill} />
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Material: legend above the chart on mobile, below it on larger screens. */}
        <ul
          className={cx(
            'type-caption flex flex-wrap gap-x-4 gap-y-1 px-4 text-on-surface/60',
            compact ? '-order-1 pb-2' : 'pt-2 pb-4',
          )}
        >
          <li className="flex items-center gap-1.5">
            <span className="w-4 border-t border-dashed" style={{ borderColor: theme.average }} />
            Weekly average
          </li>
          <li className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm" style={{ background: theme.volumeCurrent }} />
            Current week (in progress)
          </li>
          <li>{canHover ? 'Hover over' : 'Touch'} a bar for details</li>
        </ul>
      </div>
      {compact && <div className="h-4" />}
    </Card>
  )
}
