import { format } from 'date-fns'
import { useMemo, useState } from 'react'
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatPace, formatSigned, paceFrom } from '../../lib/format'
import { cadenceSeries, type RunPoint } from '../../lib/insights'
import type { Activity, DateRange } from '../../lib/types'
import { Card, CardHeader } from '../../md/Card'
import { useIsCompact } from '../../md/layout'
import { ActivePointBridge } from '../charts/ActivePointBridge'
import { chartTheme } from '../charts/chartTheme'
import { ChartReadout } from '../overview/ChartReadout'

export function CadenceTrendCard({
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
  const theme = chartTheme(dark)
  const [selected, setSelected] = useState<RunPoint | null>(null)
  const points = useMemo(() => cadenceSeries(activities, range), [activities, range])

  if (points.length === 0) {
    return (
      <Card className="flex flex-col">
        <CardHeader title="Cadence" subtitle="All runs · steps per minute" />
        <div className="flex h-56 items-center px-4 pb-10 sm:h-64 lg:h-72">
          <p className="type-body2 text-on-surface/60">No runs with cadence in this range.</p>
        </div>
      </Card>
    )
  }

  const latest = points.at(-1)!
  const first4 = points.slice(0, Math.min(4, Math.max(1, Math.floor(points.length / 2))))
  const last4 = points.slice(-first4.length)
  const mean = (xs: RunPoint[]) => xs.reduce((s, p) => s + p.value, 0) / xs.length
  const change = mean(last4) - mean(first4)
  const values = points.flatMap((p) => [p.value, p.average])
  const low = Math.floor(Math.min(...values) / 10) * 10
  const high = Math.ceil(Math.max(...values) / 10) * 10
  const domain: [number, number] = [low - 2, high + 2]
  const step = high - low > 60 ? 20 : 10
  const ticks: number[] = []
  for (let v = low; v <= high; v += step) ticks.push(v)
  const tick = { fontSize: 12, fill: theme.axis }
  const yWidth = compact ? 32 : 40

  return (
    <Card className="flex flex-col">
      <CardHeader title="Cadence" subtitle="All runs · steps per minute" />

      <ChartReadout
        heading={selected ? format(new Date(selected.ts), 'EEE d MMM yyyy') : rangeLabel}
        values={
          selected
            ? [
                { label: 'Cadence', value: `${selected.value.toFixed(0)} spm`, color: theme.cadence },
                { label: '4-wk avg', value: `${selected.average.toFixed(0)} spm`, color: theme.rolling },
                { label: 'Pace /km', value: formatPace(paceFrom(selected.activity.distanceM, selected.activity.movingS)) },
                {
                  label: 'Avg HR',
                  value: selected.activity.avgHr ? `${Math.round(selected.activity.avgHr)} bpm` : '–',
                },
              ]
            : [
                { label: 'Runs', value: points.length },
                { label: 'Latest', value: `${latest.value.toFixed(0)} spm`, color: theme.cadence },
                { label: '4-wk avg', value: `${latest.average.toFixed(0)} spm`, color: theme.rolling },
                { label: 'Change', value: `${formatSigned(change)} spm` },
              ]
        }
      />

      <div className="h-56 px-2 sm:h-64 lg:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={points}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            onMouseLeave={() => setSelected(null)}
          >
            <CartesianGrid vertical={false} stroke={theme.grid} />
            <XAxis
              dataKey="ts"
              type="number"
              domain={[range.start.getTime(), range.end.getTime()]}
              tickFormatter={(ts: number) => format(new Date(ts), 'd MMM')}
              minTickGap={compact ? 28 : 20}
              tick={tick}
              tickLine={false}
              axisLine={{ stroke: theme.grid }}
            />
            <YAxis
              width={yWidth}
              domain={domain}
              ticks={ticks}
              allowDecimals={false}
              tick={tick}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ stroke: theme.axis, strokeDasharray: '3 3' }}
              content={(props) => (
                <ActivePointBridge<RunPoint> active={props.active} payload={props.payload} onChange={setSelected} />
              )}
            />
            <Scatter dataKey="value" fill={theme.cadence} isAnimationActive={false} />
            <Line
              dataKey="average"
              type="monotone"
              stroke={theme.rolling}
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <ul className="type-caption flex flex-wrap gap-x-4 gap-y-1 px-4 pt-2 pb-4 text-on-surface/60">
        <li className="flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ background: theme.cadence }} />
          Run
        </li>
        <li className="flex items-center gap-1.5">
          <span className="w-4 border-t-2" style={{ borderColor: theme.rolling }} />
          4-week average
        </li>
      </ul>
    </Card>
  )
}
