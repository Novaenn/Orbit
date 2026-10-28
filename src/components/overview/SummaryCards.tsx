import { format } from 'date-fns'
import type { ReactNode } from 'react'
import { parseLocal } from '../../lib/dates'
import { formZone, type FitnessPoint } from '../../lib/fitness'
import { formatHours, formatPace, formatSigned, paceFrom } from '../../lib/format'
import type { PeriodTotals, Summary } from '../../lib/summary'
import { Card } from '../../md/Card'
import { cx } from '../../md/cx'

const ZONE_TEXT = {
  blue: 'text-primary',
  green: 'text-success',
  gray: 'text-on-surface/87',
  amber: 'text-warning',
  red: 'text-error',
}

function SummaryCard({
  label,
  value,
  unit,
  sub,
  valueClass,
}: {
  label: string
  value: ReactNode
  unit?: string
  sub?: ReactNode
  valueClass?: string
}) {
  return (
    <Card className="min-w-0 p-4">
      <div className="type-overline truncate leading-5 text-on-surface/60">{label}</div>
      <div className={cx('type-h4 mt-1 tabular-nums', valueClass ?? 'text-on-surface/87')}>
        {value}
        {unit && <span className="type-subtitle1 ml-1 text-on-surface/60">{unit}</span>}
      </div>
      {sub && <div className="type-caption mt-1 truncate text-on-surface/60">{sub}</div>}
    </Card>
  )
}

function totalsSub(t: PeriodTotals): string {
  if (t.runs === 0) return 'No runs'
  return `${formatHours(t.movingS)} · ${t.runs} run${t.runs === 1 ? '' : 's'}`
}

export function SummaryCards({
  summary,
  current,
  today,
}: {
  summary: Summary
  current: FitnessPoint | undefined
  today: Date
}) {
  const { thisWeek, lastWeek, thisMonth, yearToDate, last4Weeks, longestRun, streakWeeks } = summary
  const zone = current ? formZone(current.form) : null
  const avgPace = paceFrom(last4Weeks.distanceM, last4Weeks.movingS)

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
      <SummaryCard label="This week" value={(thisWeek.distanceM / 1000).toFixed(1)} unit="km" sub={totalsSub(thisWeek)} />
      <SummaryCard label="Last week" value={(lastWeek.distanceM / 1000).toFixed(1)} unit="km" sub={totalsSub(lastWeek)} />
      <SummaryCard
        label={format(today, 'MMMM')}
        value={(thisMonth.distanceM / 1000).toFixed(0)}
        unit="km"
        sub={totalsSub(thisMonth)}
      />
      <SummaryCard
        label={`${format(today, 'yyyy')} so far`}
        value={(yearToDate.distanceM / 1000).toFixed(0)}
        unit="km"
        sub={totalsSub(yearToDate)}
      />
      <SummaryCard
        label="4-week pace"
        value={formatPace(avgPace)}
        unit="/km"
        sub={last4Weeks.runs ? `${(last4Weeks.distanceM / 1000).toFixed(0)} km · ${last4Weeks.runs} runs` : 'No runs'}
      />
      <SummaryCard
        label="Longest run"
        value={longestRun ? (longestRun.distanceM / 1000).toFixed(1) : '–'}
        unit={longestRun ? 'km' : undefined}
        sub={longestRun && format(parseLocal(longestRun.date), 'd MMM yyyy')}
      />
      <SummaryCard
        label="Streak"
        value={streakWeeks}
        unit={streakWeeks === 1 ? 'week' : 'weeks'}
        sub="with at least 1 run"
      />
      <SummaryCard
        label="Form"
        value={current ? formatSigned(current.form) : '–'}
        valueClass={zone ? ZONE_TEXT[zone.tone] : undefined}
        sub={zone ? `${zone.label} zone` : undefined}
      />
    </div>
  )
}
