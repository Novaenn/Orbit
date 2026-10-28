import { mdiFlagCheckered } from '@mdi/js'
import { format } from 'date-fns'
import { parseLocal } from '../../lib/dates'
import { formatDuration, formatPace } from '../../lib/format'
import { vdotFromPerformance } from '../../lib/predict'
import { raceTime } from '../../lib/races'
import type { Activity, RaceOverrides } from '../../lib/types'
import { Card, CardHeader } from '../../md/Card'
import { DataTable, type Column } from '../../md/DataTable'
import { useMediaQuery } from '../../md/layout'
import { ListAvatar, ListItem } from '../../md/List'
import { RaceToggle } from './RaceToggle'

interface RaceRow {
  activity: Activity
  seconds: number
  pace: number
  vdot: number | null
  manual: boolean
}

export function RaceHistory({
  races,
  overrides,
  onToggleRace,
  onOpenActivity,
}: {
  races: Activity[]
  overrides: RaceOverrides
  onToggleRace: (a: Activity) => void
  onOpenActivity: (id: string) => void
}) {
  const wide = useMediaQuery('(min-width: 905px)')
  const rows: RaceRow[] = races.map((r) => {
    const seconds = raceTime(r)
    return {
      activity: r,
      seconds,
      pace: seconds / (r.distanceM / 1000),
      vdot: r.distanceM >= 1500 ? vdotFromPerformance(r.distanceM, seconds) : null,
      manual: r.id in overrides,
    }
  })

  const columns: Column<RaceRow>[] = [
    {
      key: 'date',
      header: 'Date',
      className: 'whitespace-nowrap',
      cell: (r) => format(parseLocal(r.activity.date), 'd MMM yyyy'),
    },
    {
      key: 'name',
      header: 'Race',
      className: 'max-w-72',
      cell: (r) => (
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => onOpenActivity(r.activity.id)}
            className="block max-w-full truncate rounded text-left hover:underline focus-visible:underline"
          >
            {r.activity.name}
          </button>
          {r.manual && <div className="type-caption text-on-surface/60">Marked by you</div>}
        </div>
      ),
    },
    { key: 'distance', header: 'Distance', numeric: true, cell: (r) => `${(r.activity.distanceM / 1000).toFixed(2)} km` },
    { key: 'time', header: 'Time', numeric: true, cell: (r) => <span className="font-medium">{formatDuration(r.seconds)}</span> },
    { key: 'pace', header: 'Pace', numeric: true, cell: (r) => `${formatPace(r.pace)} /km` },
    {
      key: 'hr',
      header: 'Avg HR',
      numeric: true,
      className: 'hidden lg:table-cell',
      cell: (r) => (r.activity.avgHr ? Math.round(r.activity.avgHr) : '–'),
    },
    { key: 'vdot', header: 'VDOT', numeric: true, cell: (r) => (r.vdot ? r.vdot.toFixed(1) : '–') },
    {
      key: 'race',
      header: '',
      numeric: true,
      className: 'w-16 pr-2!',
      cell: (r) => <RaceToggle isRace name={r.activity.name} onToggle={() => onToggleRace(r.activity)} />,
    },
  ]

  return (
    <Card>
      <CardHeader
        title="Race history"
        subtitle="Found from 🏁, “parkrun” or the race flag. Use the flag to remove one."
      />
      {rows.length === 0 ? (
        <p className="type-body2 px-4 pb-6 text-on-surface/60">
          No races yet. Mark a run as a race from the Activities list.
        </p>
      ) : wide ? (
        <div className="pb-2">
          <DataTable
            label="Race history"
            columns={columns}
            rows={rows}
            rowKey={(r) => r.activity.id}
            onRowClick={(r) => onOpenActivity(r.activity.id)}
          />
        </div>
      ) : (
        <ul className="pb-2">
          {rows.map((r) => (
            <ListItem
              key={r.activity.id}
              threeLine
              onClick={() => onOpenActivity(r.activity.id)}
              actionLabel={`Open ${r.activity.name}`}
              leading={<ListAvatar icon={mdiFlagCheckered} tone="secondary" />}
              primary={r.activity.name}
              secondary={
                <>
                  <span className="font-medium text-on-surface/87 tabular-nums">{formatDuration(r.seconds)}</span>
                  {` · ${(r.activity.distanceM / 1000).toFixed(2)} km · ${formatPace(r.pace)} /km`}
                  <br />
                  {format(parseLocal(r.activity.date), 'd MMM yyyy')}
                  {r.vdot && ` · VDOT ${r.vdot.toFixed(1)}`}
                  {r.manual && ' · marked by you'}
                </>
              }
              trailingIsButton
              trailing={<RaceToggle isRace name={r.activity.name} onToggle={() => onToggleRace(r.activity)} />}
            />
          ))}
        </ul>
      )}
    </Card>
  )
}
