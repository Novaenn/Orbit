import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Rectangle,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type BarShapeProps,
} from 'recharts'
import { formatPace } from '../../lib/format'
import { hourPattern, weekdayPattern, type PatternBucket } from '../../lib/insights'
import type { Activity, DateRange } from '../../lib/types'
import { Card, CardHeader } from '../../md/Card'
import { useIsCompact, useMediaQuery } from '../../md/layout'
import { ToggleButtonGroup } from '../../md/ToggleButtonGroup'
import { ActivePointBridge } from '../charts/ActivePointBridge'
import { chartTheme } from '../charts/chartTheme'
import { ChartReadout } from '../overview/ChartReadout'

type Mode = 'weekday' | 'hour'

const HOUR_TICKS = ['00', '03', '06', '09', '12', '15', '18', '21']

export function TrainingPatternsCard({
  activities,
  range,
  rangeLabel,
  dark,
}: {
  activities: Activity[]
  range: DateRange
  rangeLabel: string
  dark: boolean
}) {
  const compact = useIsCompact()
  const canHover = useMediaQuery('(hover: hover)')
  const theme = chartTheme(dark)
  const [mode, setMode] = useState<Mode>('weekday')
  const [selected, setSelected] = useState<PatternBucket | null>(null)

  const buckets = useMemo(
    () => (mode === 'weekday' ? weekdayPattern(activities, range) : hourPattern(activities, range)),
    [activities, range, mode],
  )

  const totalRuns = buckets.reduce((s, b) => s + b.runs, 0)
  const totalDistanceM = buckets.reduce((s, b) => s + b.distanceM, 0)
  const totalMovingS = buckets.reduce((s, b) => s + b.movingS, 0)
  const busiest = buckets.reduce((b, x) => (x.runs > b.runs ? x : b), buckets[0])
  const avgPace =
    totalDistanceM > 0 && totalMovingS > 0 ? totalMovingS / (totalDistanceM / 1000) : null

  const switchMode = (next: Mode) => {
    setMode(next)
    setSelected(null)
  }

  return (
    <Card className="flex flex-col">
      <CardHeader
        title="Training patterns"
        subtitle={mode === 'weekday' ? 'Runs only · by weekday' : 'Runs only · by time of day'}
      />

      <div className="px-4 pb-2">
        <ToggleButtonGroup
          label="Training pattern view"
          value={mode}
          onChange={switchMode}
          options={[
            { value: 'weekday', label: 'Weekday' },
            { value: 'hour', label: 'Time of day' },
          ]}
        />
      </div>

      {totalRuns === 0 ? (
        <div className="flex h-56 items-center px-4 pb-10 sm:h-64 lg:h-72">
          <p className="type-body2 text-on-surface/60">No runs in this range.</p>
        </div>
      ) : (
        <>
          <ChartReadout
            heading={selected ? selected.label : rangeLabel}
            values={
              selected
                ? [
                    { label: 'Runs', value: selected.runs },
                    { label: 'Distance', value: `${(selected.distanceM / 1000).toFixed(1)} km` },
                    { label: 'Avg pace', value: formatPace(selected.pace) },
                    {
                      label: 'Share',
                      value: `${Math.round((selected.runs / totalRuns) * 100)}%`,
                    },
                  ]
                : [
                    { label: 'Runs', value: totalRuns },
                    { label: 'Distance', value: `${(totalDistanceM / 1000).toFixed(1)} km` },
                    { label: 'Avg pace', value: formatPace(avgPace) },
                    {
                      label: mode === 'weekday' ? 'Busiest day' : 'Peak hour',
                      value: `${busiest.shortLabel} · ${busiest.runs}`,
                    },
                  ]
            }
          />

          <div className="h-56 px-2 sm:h-64 lg:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={buckets}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                onMouseLeave={() => setSelected(null)}
              >
                <CartesianGrid vertical={false} stroke={theme.grid} />
                <XAxis
                  dataKey="shortLabel"
                  interval={0}
                  ticks={mode === 'hour' ? HOUR_TICKS : undefined}
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
                />
                <Tooltip
                  cursor={{ fill: theme.cursor }}
                  content={(props) => (
                    <ActivePointBridge<PatternBucket>
                      active={props.active}
                      payload={props.payload}
                      onChange={setSelected}
                    />
                  )}
                />
                <Bar
                  dataKey="runs"
                  radius={[2, 2, 0, 0]}
                  maxBarSize={mode === 'weekday' ? 40 : 18}
                  isAnimationActive={false}
                  shape={(props: BarShapeProps) => {
                    const bucket = props.payload as PatternBucket
                    const fill =
                      selected?.key === bucket.key ? theme.volumeSelected : theme.volume
                    return <Rectangle {...props} fill={fill} />
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <p className="type-caption px-4 pt-2 pb-4 text-on-surface/60">
            {canHover ? 'Hover over' : 'Touch'} a bar for distance and pace.
          </p>
        </>
      )}
    </Card>
  )
}
