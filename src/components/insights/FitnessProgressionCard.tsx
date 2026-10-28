import { format } from 'date-fns'
import { useMemo, useState, type ReactNode } from 'react'
import {
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatDuration, formatPace, formatSigned } from '../../lib/format'
import {
  efficiencySeries,
  relativeChange,
  thresholdPaceSteps,
  vdotSeries,
  type RacePoint,
  type RunPoint,
  type ThresholdStep,
} from '../../lib/insights'
import { raceTime } from '../../lib/races'
import type { Activity, DateRange } from '../../lib/types'
import { Card, CardHeader } from '../../md/Card'
import { useIsCompact } from '../../md/layout'
import { ToggleButtonGroup } from '../../md/ToggleButtonGroup'
import { ActivePointBridge } from '../charts/ActivePointBridge'
import { chartTheme } from '../charts/chartTheme'
import { ChartReadout } from '../overview/ChartReadout'

type View = 'efficiency' | 'vdot' | 'threshold'

const SUBTITLES: Record<View, string> = {
  efficiency: 'Easy & long runs · metres per heartbeat',
  vdot: "Races · Jack Daniels' fitness score",
  threshold: "intervals.icu's threshold pace estimate",
}

export function FitnessProgressionCard({
  activities,
  races,
  raceIds,
  range,
  rangeLabel,
  dark,
}: {
  activities: Activity[]
  races: Activity[]
  raceIds: ReadonlySet<string>
  range: DateRange
  rangeLabel: string
  dark: boolean
}) {
  const [view, setView] = useState<View>('efficiency')

  return (
    <Card className="flex flex-col">
      <CardHeader title="Fitness progression" subtitle={SUBTITLES[view]} />

      <div className="px-4 pb-2">
        <ToggleButtonGroup
          label="Progression view"
          value={view}
          onChange={setView}
          options={[
            { value: 'efficiency', label: 'Efficiency' },
            { value: 'vdot', label: 'VDOT' },
            { value: 'threshold', label: 'Pace' },
          ]}
        />
      </div>

      {view === 'efficiency' && (
        <EfficiencyView activities={activities} raceIds={raceIds} range={range} rangeLabel={rangeLabel} dark={dark} />
      )}
      {view === 'vdot' && <VdotView races={races} range={range} rangeLabel={rangeLabel} dark={dark} />}
      {view === 'threshold' && (
        <ThresholdView activities={activities} range={range} rangeLabel={rangeLabel} dark={dark} />
      )}
    </Card>
  )
}

function EfficiencyView({
  activities,
  raceIds,
  range,
  rangeLabel,
  dark,
}: {
  activities: Activity[]
  raceIds: ReadonlySet<string>
  range: DateRange
  rangeLabel: string
  dark: boolean
}) {
  const compact = useIsCompact()
  const theme = chartTheme(dark)
  const [selected, setSelected] = useState<RunPoint | null>(null)
  const points = useMemo(
    () => efficiencySeries(activities, range, raceIds),
    [activities, range, raceIds],
  )

  if (points.length === 0) {
    return <Empty>No easy or long runs with heart rate in this range.</Empty>
  }

  const latest = points.at(-1)!
  const average = points.reduce((s, p) => s + p.value, 0) / points.length
  const change = relativeChange(points.map((p) => p.value))
  const values = points.flatMap((p) => [p.value, p.average])
  const low = Math.floor(Math.min(...values) * 10) / 10
  const high = Math.ceil(Math.max(...values) * 10) / 10
  const domain: [number, number] = [low - 0.05, high + 0.05]
  const ticks: number[] = []
  for (let v = low; v <= high + 1e-9; v += 0.1) ticks.push(Number(v.toFixed(1)))
  const tick = { fontSize: 12, fill: theme.axis }
  const yWidth = compact ? 32 : 40

  return (
    <>
      <ChartReadout
        heading={
          selected ? format(new Date(selected.ts), 'EEE d MMM yyyy') : rangeLabel
        }
        values={
          selected
            ? [
                { label: 'Efficiency', value: selected.value.toFixed(2), color: theme.dot },
                { label: '4-wk avg', value: selected.average.toFixed(2), color: theme.rolling },
                {
                  label: 'Pace /km',
                  value: formatPace(selected.activity.movingS / (selected.activity.distanceM / 1000)),
                },
                {
                  label: 'Avg HR',
                  value: selected.activity.avgHr ? `${Math.round(selected.activity.avgHr)} bpm` : '–',
                },
              ]
            : [
                { label: 'Runs', value: points.length },
                { label: '4-wk avg', value: latest.average.toFixed(2), color: theme.rolling },
                { label: 'Average', value: average.toFixed(2), color: theme.dot },
                {
                  label: 'Change',
                  value: change === null ? '–' : `${formatSigned(change * 100)}%`,
                },
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
              tickFormatter={(v: number) => v.toFixed(1)}
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
            <Scatter dataKey="value" fill={theme.dot} isAnimationActive={false} />
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

      <Legend>
        <li className="flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ background: theme.dot }} />
          Run
        </li>
        <li className="flex items-center gap-1.5">
          <span className="w-4 border-t-2" style={{ borderColor: theme.rolling }} />
          4-week average
        </li>
      </Legend>
    </>
  )
}

function VdotView({
  races,
  range,
  rangeLabel,
  dark,
}: {
  races: Activity[]
  range: DateRange
  rangeLabel: string
  dark: boolean
}) {
  const compact = useIsCompact()
  const theme = chartTheme(dark)
  const [selected, setSelected] = useState<RacePoint | null>(null)
  const points = useMemo(() => vdotSeries(races, range), [races, range])

  if (points.length === 0) {
    return <Empty>No races in this range.</Empty>
  }

  const first = points[0]
  const latest = points.at(-1)!
  const best = points.reduce((b, p) => (p.value > b.value ? p : b), first)
  const values = points.map((p) => p.value)
  const low = Math.floor(Math.min(...values) - 1)
  const high = Math.ceil(Math.max(...values) + 1)
  const domain: [number, number] = [low, high]
  const step = high - low > 20 ? 5 : 2
  const ticks: number[] = []
  for (let v = Math.ceil(low / step) * step; v <= high; v += step) ticks.push(v)
  const tick = { fontSize: 12, fill: theme.axis }
  const yWidth = compact ? 32 : 40

  return (
    <>
      <ChartReadout
        heading={selected ? format(new Date(selected.ts), 'EEE d MMM yyyy') : rangeLabel}
        values={
          selected
            ? [
                { label: 'VDOT', value: selected.value.toFixed(1), color: theme.vdot },
                { label: 'Distance', value: `${(selected.activity.distanceM / 1000).toFixed(1)} km` },
                { label: 'Time', value: formatDuration(raceTime(selected.activity)) },
                {
                  label: 'Pace /km',
                  value: formatPace(raceTime(selected.activity) / (selected.activity.distanceM / 1000)),
                },
              ]
            : [
                { label: 'Races', value: points.length },
                { label: 'First', value: first.value.toFixed(1), color: theme.vdot },
                { label: 'Best', value: best.value.toFixed(1), color: theme.vdot },
                { label: 'Latest', value: latest.value.toFixed(1), color: theme.vdot },
              ]
        }
      />

      <div className="h-56 px-2 sm:h-64 lg:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
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
                <ActivePointBridge<RacePoint> active={props.active} payload={props.payload} onChange={setSelected} />
              )}
            />
            <Line
              dataKey="value"
              type="monotone"
              stroke={theme.vdot}
              strokeWidth={2.5}
              dot={{ r: 3, fill: theme.vdot, strokeWidth: 0 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <Legend>
        <li className="flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ background: theme.vdot }} />
          Each dot is a race
        </li>
        <li>Higher is fitter</li>
      </Legend>
    </>
  )
}

function ThresholdView({
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
  const [selected, setSelected] = useState<ThresholdStep | null>(null)
  const steps = useMemo(() => thresholdPaceSteps(activities, range), [activities, range])

  if (steps.length === 0) {
    return <Empty>No threshold pace in this range. Upload your CSV again if it was imported before this feature.</Empty>
  }

  const first = steps[0]
  const latest = steps.at(-1)!
  const best = steps.reduce((b, p) => (p.pace < b.pace ? p : b), first)
  const selectedIndex = selected ? steps.findIndex((s) => s.ts === selected.ts) : -1
  const previous = selectedIndex > 0 ? steps[selectedIndex - 1] : null
  const paces = steps.map((s) => s.pace)
  const domain: [number, number] = [
    Math.min(...paces) - 5,
    Math.max(...paces) + 5,
  ]
  const tickStep = 15
  const ticks: number[] = []
  for (let v = Math.ceil(Math.min(...paces) / tickStep) * tickStep; v <= Math.max(...paces); v += tickStep) {
    ticks.push(v)
  }
  const tick = { fontSize: 12, fill: theme.axis }
  const yWidth = compact ? 44 : 52

  return (
    <>
      <ChartReadout
        heading={selected ? format(new Date(selected.ts), 'EEE d MMM yyyy') : rangeLabel}
        values={
          selected
            ? [
                { label: 'Threshold', value: formatPace(selected.pace), color: theme.threshold },
                { label: 'Previous', value: previous ? formatPace(previous.pace) : '–' },
                {
                  label: 'Change',
                  value: previous ? `${formatSigned(selected.pace - previous.pace)} s/km` : '–',
                },
                { label: 'Best', value: formatPace(best.pace) },
              ]
            : [
                { label: 'Now', value: formatPace(latest.pace), color: theme.threshold },
                { label: 'Start', value: formatPace(first.pace) },
                {
                  label: 'Change',
                  value:
                    latest.pace === first.pace
                      ? 'No change'
                      : `${formatSigned(latest.pace - first.pace)} s/km`,
                },
                { label: 'Best', value: formatPace(best.pace) },
              ]
        }
      />

      <div className="h-56 px-2 sm:h-64 lg:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={steps}
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
              ticks={ticks.length > 0 ? ticks : undefined}
              reversed
              tickFormatter={(v: number) => formatPace(v)}
              tick={tick}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ stroke: theme.axis, strokeDasharray: '3 3' }}
              content={(props) => (
                <ActivePointBridge<ThresholdStep>
                  active={props.active}
                  payload={props.payload}
                  onChange={setSelected}
                />
              )}
            />
            <Line
              dataKey="pace"
              type="stepAfter"
              stroke={theme.threshold}
              strokeWidth={2.5}
              dot={{ r: 3, fill: theme.threshold, strokeWidth: 0 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <Legend>
        <li className="flex items-center gap-1.5">
          <span className="w-4 border-t-2" style={{ borderColor: theme.threshold }} />
          Threshold updates
        </li>
        <li>Axis is inverted: higher is faster</li>
      </Legend>
    </>
  )
}

function Legend({ children }: { children: ReactNode }) {
  return (
    <ul className="type-caption flex flex-wrap gap-x-4 gap-y-1 px-4 pt-2 pb-4 text-on-surface/60">
      {children}
    </ul>
  )
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-56 items-center px-4 pb-10 sm:h-64 lg:h-72">
      <p className="type-body2 text-on-surface/60">{children}</p>
    </div>
  )
}
