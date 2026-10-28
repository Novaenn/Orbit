import { mdiInformationOutline } from '@mdi/js'
import { format } from 'date-fns'
import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formZone, type FitnessPoint } from '../../lib/fitness'
import { formatSigned } from '../../lib/format'
import type { DateRange } from '../../lib/types'
import { Button, IconButton } from '../../md/Button'
import { Card, CardHeader } from '../../md/Card'
import { Dialog } from '../../md/Dialog'
import { useIsCompact } from '../../md/layout'
import { ActivePointBridge } from '../charts/ActivePointBridge'
import { chartTheme } from '../charts/chartTheme'
import { ChartReadout } from './ChartReadout'

const FORM_ZONES = [
  { label: 'Transition', range: 'above 20', meaning: 'Very fresh, but losing fitness', swatch: 'bg-[#0288d1] dark:bg-[#81d4fa]' },
  { label: 'Fresh', range: '5 to 20', meaning: 'Rested, good for racing', swatch: 'bg-[#388e3c] dark:bg-[#a5d6a7]' },
  { label: 'Neutral', range: '−10 to 5', meaning: 'Maintaining fitness', swatch: 'bg-on-surface/38' },
  { label: 'Productive', range: '−30 to −10', meaning: 'Building fitness', swatch: 'bg-[#ff8f00] dark:bg-[#ffe082]' },
  { label: 'High risk', range: 'below −30', meaning: 'Very fatigued, consider resting', swatch: 'bg-[#d32f2f] dark:bg-[#ef9a9a]' },
]

export function FitnessChart({
  series,
  range,
  today,
  dark,
}: {
  series: FitnessPoint[]
  range: DateRange
  today: Date
  dark: boolean
}) {
  const compact = useIsCompact()
  const theme = chartTheme(dark)
  const [selected, setSelected] = useState<FitnessPoint | null>(null)
  const [infoOpen, setInfoOpen] = useState(false)

  const data = useMemo(
    () => series.filter((p) => p.ts >= range.start.getTime() && p.ts <= range.end.getTime()),
    [series, range],
  )
  const latest = data.at(-1)
  const shown = selected ?? latest

  const formDomain = useMemo(() => {
    const forms = data.map((p) => p.form)
    const min = Math.min(-35, Math.floor(Math.min(...forms) - 5))
    const max = Math.max(25, Math.ceil(Math.max(...forms) + 5))
    return [min, max] as [number, number]
  }, [data])

  if (!shown) return null

  const isToday = !selected && format(today, 'yyyy-MM-dd') === shown.date
  const zone = formZone(shown.form)
  const tick = { fontSize: 12, fill: theme.axis }
  const yWidth = compact ? 32 : 40

  return (
    <Card className="flex flex-col">
      <CardHeader
        title="Fitness & form"
        subtitle="All activities · calculated like intervals.icu"
        action={
          <IconButton
            icon={mdiInformationOutline}
            label="About fitness and form"
            tooltipAlign="end"
            onClick={() => setInfoOpen(true)}
            className="text-on-surface/60"
          />
        }
      />

      <ChartReadout
        heading={isToday ? 'Today' : format(new Date(shown.ts), 'EEE d MMM yyyy')}
        values={[
          { label: 'Fitness', value: shown.fitness.toFixed(0), color: theme.fitness },
          { label: 'Fatigue', value: shown.fatigue.toFixed(0), color: theme.fatigue },
          { label: 'Form', value: formatSigned(shown.form), color: theme.form },
          { label: 'Zone', value: <span className="type-subtitle2">{zone.label}</span> },
        ]}
      />

      <div className="h-40 px-2 sm:h-48 lg:h-52">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            syncId="fitness"
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            onMouseLeave={() => setSelected(null)}
          >
            <CartesianGrid vertical={false} stroke={theme.grid} />
            <XAxis dataKey="date" hide />
            <YAxis width={yWidth} tick={tick} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              cursor={{ stroke: theme.axis, strokeDasharray: '3 3' }}
              content={(props) => (
                <ActivePointBridge<FitnessPoint> active={props.active} payload={props.payload} onChange={setSelected} />
              )}
            />
            <Line dataKey="fatigue" stroke={theme.fatigue} strokeWidth={1.5} dot={false} isAnimationActive={false} />
            <Line dataKey="fitness" stroke={theme.fitness} strokeWidth={2.5} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="h-28 px-2 sm:h-32">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            syncId="fitness"
            margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
            onMouseLeave={() => setSelected(null)}
          >
            <ReferenceArea y1={20} y2={formDomain[1]} fill={theme.zones.transition} ifOverflow="hidden" />
            <ReferenceArea y1={5} y2={20} fill={theme.zones.fresh} ifOverflow="hidden" />
            <ReferenceArea y1={-10} y2={5} fill={theme.zones.neutral} ifOverflow="hidden" />
            <ReferenceArea y1={-30} y2={-10} fill={theme.zones.productive} ifOverflow="hidden" />
            <ReferenceArea y1={formDomain[0]} y2={-30} fill={theme.zones.risk} ifOverflow="hidden" />
            <XAxis
              dataKey="date"
              tickFormatter={(d: string) => format(new Date(`${d}T00:00:00`), 'd MMM')}
              interval="preserveStartEnd"
              minTickGap={compact ? 28 : 20}
              tick={tick}
              tickLine={false}
              axisLine={{ stroke: theme.grid }}
            />
            <YAxis
              width={yWidth}
              domain={formDomain}
              ticks={[-30, 0, 20]}
              tick={{ ...tick, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <ReferenceLine y={0} stroke={theme.axis} strokeOpacity={0.4} />
            <Tooltip
              cursor={{ stroke: theme.axis, strokeDasharray: '3 3' }}
              content={(props) => (
                <ActivePointBridge<FitnessPoint> active={props.active} payload={props.payload} onChange={setSelected} />
              )}
            />
            <Area
              dataKey="form"
              type="monotone"
              stroke={theme.form}
              strokeWidth={2}
              fill={theme.form}
              fillOpacity={0.2}
              baseValue={0}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <ul className="type-caption flex flex-wrap gap-x-4 gap-y-1 px-4 pt-2 pb-4 text-on-surface/60">
        {FORM_ZONES.map((z) => (
          <li key={z.label} className="flex items-center gap-1.5">
            <span className={`size-2.5 rounded-sm ${z.swatch}`} />
            {z.label}
          </li>
        ))}
      </ul>

      <Dialog
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        title="About fitness and form"
        actions={
          <Button onClick={() => setInfoOpen(false)} data-autofocus>
            Got it
          </Button>
        }
      >
        <p>
          <strong className="font-medium text-on-surface/87">Fitness</strong> is your training load averaged over
          about 6 weeks. <strong className="font-medium text-on-surface/87">Fatigue</strong> is the same over about
          one week. <strong className="font-medium text-on-surface/87">Form</strong> is fitness minus fatigue.
        </p>
        <ul className="mt-4 space-y-2">
          {FORM_ZONES.map((z) => (
            <li key={z.label} className="type-body2 flex items-start gap-3">
              <span className={`mt-1 size-3 shrink-0 rounded-sm ${z.swatch}`} />
              <span>
                <span className="font-medium text-on-surface/87">{z.label}</span> ({z.range}): {z.meaning}
              </span>
            </li>
          ))}
        </ul>
      </Dialog>
    </Card>
  )
}
