import { format } from 'date-fns'
import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { parseLocal, weekKey } from '../../lib/dates'
import { formatHours } from '../../lib/format'
import { ZONE_NAMES, latestZoneBounds, zoneRange } from '../../lib/hrZones'
import { weeklyZoneTotals, zoneShare, type WeekZones } from '../../lib/insights'
import type { Activity, DateRange } from '../../lib/types'
import { Card, CardHeader } from '../../md/Card'
import { cx } from '../../md/cx'
import { useIsCompact } from '../../md/layout'
import { ToggleButtonGroup } from '../../md/ToggleButtonGroup'
import { ActivePointBridge } from '../charts/ActivePointBridge'
import { chartTheme } from '../charts/chartTheme'
import { ChartReadout } from '../overview/ChartReadout'

type Unit = 'hours' | 'percent'

type ZoneRow = WeekZones & {
  z1: number
  z2: number
  z3: number
  z4: number
  z5: number
  z6: number
  z7: number
}

export function ZoneDistributionCard({
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
  const [unit, setUnit] = useState<Unit>('hours')
  const [selected, setSelected] = useState<ZoneRow | null>(null)
  const compact = useIsCompact()
  const theme = chartTheme(dark)

  const weeks = useMemo(() => weeklyZoneTotals(activities, range), [activities, range])
  const currentWeek = weekKey(today)

  const rows = useMemo<ZoneRow[]>(
    () =>
      weeks.map((w) => {
        const value = (i: number) =>
          unit === 'hours'
            ? w.seconds[i] / 3600
            : w.totalS > 0
              ? (w.seconds[i] / w.totalS) * 100
              : 0
        return {
          ...w,
          z1: value(0),
          z2: value(1),
          z3: value(2),
          z4: value(3),
          z5: value(4),
          z6: value(5),
          z7: value(6),
        }
      }),
    [weeks, unit],
  )

  const totals = useMemo(
    () =>
      weeks.reduce(
        (sum, w) => sum.map((v, i) => v + w.seconds[i]),
        Array<number>(7).fill(0),
      ),
    [weeks],
  )
  const totalS = totals.reduce((s, v) => s + v, 0)
  const easyShare = zoneShare(totals, 0, 1)

  const bounds = useMemo(() => latestZoneBounds(activities), [activities])

  const shares = selected ? selected.seconds : totals
  const readout = {
    heading: selected ? (
      <>
        Week of {format(selected.weekStart, 'd MMM yyyy')}
        {selected.week === currentWeek && ' · so far'}
      </>
    ) : (
      rangeLabel
    ),
    values: [
      {
        label: 'Z1–Z2',
        value: `${Math.round(zoneShare(shares, 0, 1) * 100)}%`,
        color: theme.hr[1],
      },
      {
        label: 'Z3–Z4',
        value: `${Math.round(zoneShare(shares, 2, 3) * 100)}%`,
        color: theme.hr[3],
      },
      {
        label: 'Z5–Z7',
        value: `${Math.round(zoneShare(shares, 4, 6) * 100)}%`,
        color: theme.hr[5],
      },
      { label: 'Time', value: formatHours(selected ? selected.totalS : totalS) },
    ],
  }

  return (
    <Card className="flex flex-col">
      <CardHeader
        title="Heart-rate zones"
        subtitle={`Running · ${Math.round(easyShare * 100)}% in Z1–Z2`}
        action={
          <ToggleButtonGroup
            label="Zone time unit"
            value={unit}
            onChange={setUnit}
            options={[
              { value: 'hours', label: 'Hours' },
              { value: 'percent', label: '%' },
            ]}
          />
        }
      />

      <ChartReadout heading={readout.heading} values={readout.values} />

      <div className="flex flex-col">
        <ul
          className={cx(
            'type-caption flex flex-wrap gap-x-3 gap-y-1 px-4 text-on-surface/60',
            compact ? '-order-1 pb-2' : 'pt-2 pb-1',
          )}
        >
          {ZONE_NAMES.map((name, i) => (
            <li key={name} className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm" style={{ background: theme.hr[i] }} />
              <span>
                {name}
                {bounds && <span className="text-on-surface/38"> · {zoneRange(bounds, i)}</span>}
              </span>
            </li>
          ))}
        </ul>

        <div className="h-56 px-2 sm:h-64 lg:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={rows}
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
                width={compact ? 36 : 44}
                domain={unit === 'percent' ? [0, 100] : [0, 'auto']}
                tick={{ fontSize: 12, fill: theme.axis }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                tickFormatter={(v: number) => (unit === 'percent' ? `${Math.round(v)}%` : `${v}h`)}
              />
              <Tooltip
                cursor={{ fill: theme.cursor }}
                content={(props) => (
                  <ActivePointBridge<ZoneRow> active={props.active} payload={props.payload} onChange={setSelected} />
                )}
              />
              {ZONE_NAMES.map((name, i) => (
                <Bar
                  key={name}
                  dataKey={`z${i + 1}`}
                  stackId="zones"
                  fill={theme.hr[i]}
                  isAnimationActive={false}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <p className="type-caption px-4 pt-2 pb-4 text-on-surface/60">
        The usual easy-running guideline is about 80% of training time in Z1–Z2.
      </p>
    </Card>
  )
}
