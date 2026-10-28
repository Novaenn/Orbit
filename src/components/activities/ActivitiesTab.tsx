import { mdiBike, mdiHiking, mdiMagnify, mdiRadioboxBlank, mdiRadioboxMarked, mdiRun, mdiShoeSneaker, mdiSort, mdiWalk } from '@mdi/js'
import { format } from 'date-fns'
import { useMemo, useState } from 'react'
import { isRun, RUN_TYPES as RUN_ACTIVITY_TYPES } from '../../lib/activities'
import { parseLocal } from '../../lib/dates'
import { formatDuration, formatPace } from '../../lib/format'
import { classifyRun, countRunTypes, RUN_TYPES, type RunType } from '../../lib/runTypes'
import type { Activity } from '../../lib/types'
import { BottomSheet } from '../../md/BottomSheet'
import { Button } from '../../md/Button'
import { Card } from '../../md/Card'
import { cx } from '../../md/cx'
import { DataTable, Pagination, type Column, type SortDir } from '../../md/DataTable'
import { Icon } from '../../md/Icon'
import { useMediaQuery } from '../../md/layout'
import { ListAvatar, ListItem } from '../../md/List'
import { SearchField } from '../../md/SearchField'
import { Select } from '../../md/Select'
import { RaceToggle } from '../races/RaceToggle'

type SortKey = 'date' | 'distance' | 'time' | 'pace' | 'hr' | 'load'

const SORT_VALUE: Record<SortKey, (a: Activity) => number | string | null> = {
  date: (a) => a.date,
  distance: (a) => a.distanceM,
  time: (a) => a.movingS,
  pace: (a) => (a.distanceM > 0 ? a.movingS / a.distanceM : null),
  hr: (a) => a.avgHr,
  load: (a) => a.load,
}

/** Fastest pace first is the natural first click for pace. */
const DEFAULT_DIR: Record<SortKey, SortDir> = {
  date: 'desc',
  distance: 'desc',
  time: 'desc',
  pace: 'asc',
  hr: 'desc',
  load: 'desc',
}

const SORT_OPTIONS: { key: SortKey; dir: SortDir; label: string }[] = [
  { key: 'date', dir: 'desc', label: 'Newest first' },
  { key: 'date', dir: 'asc', label: 'Oldest first' },
  { key: 'distance', dir: 'desc', label: 'Longest first' },
  { key: 'time', dir: 'desc', label: 'Most time first' },
  { key: 'pace', dir: 'asc', label: 'Fastest pace first' },
  { key: 'load', dir: 'desc', label: 'Highest load first' },
]

const TYPE_ICON: Record<string, string> = { Run: mdiRun, Ride: mdiBike, Hike: mdiHiking, Walk: mdiWalk }
const PAGE_SIZES = [10, 25, 50, 100]
/** Activity types that have run types. */
const RUN_TYPES_FILTERABLE: ReadonlySet<string> = RUN_ACTIVITY_TYPES

function speedOrPace(a: Activity): string {
  if (a.distanceM <= 0 || a.movingS <= 0) return '–'
  if (a.type === 'Ride' || a.type === 'VirtualRide') return `${((a.distanceM / a.movingS) * 3.6).toFixed(1)} km/h`
  return `${formatPace(a.movingS / (a.distanceM / 1000))} /km`
}

export function ActivitiesTab({
  activities,
  raceIds,
  onToggleRace,
  onOpenActivity,
}: {
  activities: Activity[]
  raceIds: Set<string>
  onToggleRace: (a: Activity) => void
  onOpenActivity: (id: string) => void
}) {
  const wide = useMediaQuery('(min-width: 905px)')
  const [query, setQuery] = useState('')
  const [type, setType] = useState('all')
  const [runType, setRunType] = useState<RunType | 'all'>('all')
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'date', dir: 'desc' })
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(25)
  const [sortSheetOpen, setSortSheetOpen] = useState(false)

  const typeOptions = useMemo(() => {
    const counts = new Map<string, number>()
    for (const a of activities) counts.set(a.type, (counts.get(a.type) ?? 0) + 1)
    return [
      { value: 'all', label: 'All types' },
      ...[...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([t, n]) => ({ value: t, label: `${t} (${n})` })),
    ]
  }, [activities])

  const runTypeOptions = useMemo(() => {
    const counts = countRunTypes(activities, raceIds)
    return [
      { value: 'all' as const, label: 'All run types' },
      ...RUN_TYPES.filter((t) => counts.get(t.value)).map((t) => ({
        value: t.value,
        label: `${t.label} (${counts.get(t.value)})`,
      })),
    ]
  }, [activities, raceIds])

  // Run types only apply to runs, so the filter is off for rides, hikes and walks.
  const runTypeDisabled = type !== 'all' && !RUN_TYPES_FILTERABLE.has(type)
  const activeRunType = runTypeDisabled ? 'all' : runType

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const getter = SORT_VALUE[sort.key]
    return activities
      .filter(
        (a) =>
          (type === 'all' || a.type === type) &&
          (activeRunType === 'all' || classifyRun(a, raceIds) === activeRunType) &&
          (!q || a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)),
      )
      .sort((a, b) => {
        const va = getter(a)
        const vb = getter(b)
        if (va === null && vb === null) return 0
        if (va === null) return 1
        if (vb === null) return -1
        const cmp = va < vb ? -1 : va > vb ? 1 : 0
        return sort.dir === 'asc' ? cmp : -cmp
      })
  }, [activities, query, type, activeRunType, raceIds, sort])

  const lastPage = Math.max(0, Math.ceil(filtered.length / pageSize) - 1)
  const currentPage = Math.min(page, lastPage)
  const shown = filtered.slice(currentPage * pageSize, (currentPage + 1) * pageSize)
  const sortLabel =
    SORT_OPTIONS.find((o) => o.key === sort.key && o.dir === sort.dir)?.label ?? 'Sort'

  const changeSort = (key: string) => {
    const k = key as SortKey
    setSort((s) => (s.key === k ? { key: k, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key: k, dir: DEFAULT_DIR[k] }))
    setPage(0)
  }

  const raceCell = (a: Activity) =>
    isRun(a) ? <RaceToggle isRace={raceIds.has(a.id)} name={a.name} onToggle={() => onToggleRace(a)} /> : null

  const columns: Column<Activity>[] = [
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      className: 'whitespace-nowrap',
      cell: (a) => format(parseLocal(a.date), 'd MMM yyyy'),
    },
    {
      key: 'name',
      header: 'Name',
      className: 'max-w-80',
      cell: (a) => (
        <div className="flex min-w-0 items-center gap-3">
          <Icon path={TYPE_ICON[a.type] ?? mdiShoeSneaker} size={20} className="text-on-surface/60" />
          <button
            type="button"
            onClick={() => onOpenActivity(a.id)}
            title={a.description || a.name}
            className="truncate rounded text-left hover:underline focus-visible:underline"
          >
            {a.name}
          </button>
        </div>
      ),
    },
    { key: 'distance', header: 'Distance', numeric: true, sortable: true, cell: (a) => `${(a.distanceM / 1000).toFixed(2)} km` },
    { key: 'time', header: 'Time', numeric: true, sortable: true, cell: (a) => formatDuration(a.movingS) },
    { key: 'pace', header: 'Pace', numeric: true, sortable: true, cell: speedOrPace },
    {
      key: 'hr',
      header: 'Avg HR',
      numeric: true,
      sortable: true,
      className: 'hidden lg:table-cell',
      cell: (a) => (a.avgHr ? Math.round(a.avgHr) : '–'),
    },
    {
      key: 'load',
      header: 'Load',
      numeric: true,
      sortable: true,
      className: 'hidden lg:table-cell',
      cell: (a) => a.load ?? '–',
    },
    { key: 'race', header: 'Race', numeric: true, className: 'w-16 pr-2!', cell: raceCell },
  ]

  return (
    <>
      <Card>
        <div className="flex flex-col gap-3 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex items-center gap-2 md:min-w-0 md:flex-1">
              <div className="min-w-0 flex-1">
                <SearchField
                  value={query}
                  onChange={(v) => {
                    setQuery(v)
                    setPage(0)
                  }}
                  placeholder="Search"
                  label="Search activities"
                />
              </div>
              {!wide && (
                <Button icon={mdiSort} variant="outlined" onClick={() => setSortSheetOpen(true)} aria-haspopup="dialog">
                  Sort
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 md:flex md:shrink-0">
              <Select
                label="Activity type"
                value={type}
                options={typeOptions}
                onChange={(v) => {
                  setType(v)
                  setPage(0)
                }}
                className="md:w-44"
              />
              <Select
                label="Run type"
                value={activeRunType}
                options={runTypeOptions}
                disabled={runTypeDisabled}
                onChange={(v) => {
                  setRunType(v)
                  setPage(0)
                }}
                className="md:w-48"
              />
            </div>
          </div>
          <p className="type-caption text-on-surface/60" aria-live="polite">
            {filtered.length} of {activities.length} activities
            {!wide && ` · ${sortLabel.toLowerCase()}`}
          </p>
        </div>

        <hr className="border-0 border-t border-on-surface/12" />

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <Icon path={mdiMagnify} size={48} className="text-on-surface/38" />
            <p className="type-subtitle1 mt-2 text-on-surface/87">No matching activities</p>
            <p className="type-body2 text-on-surface/60">Try a different search or filter.</p>
          </div>
        ) : wide ? (
          <DataTable
            label="Activities"
            columns={columns}
            rows={shown}
            rowKey={(a) => a.id}
            sort={sort}
            onSort={changeSort}
            onRowClick={(a) => onOpenActivity(a.id)}
          />
        ) : (
          <ul className="divide-y divide-on-surface/12">
            {shown.map((a) => (
              <ListItem
                key={a.id}
                threeLine
                onClick={() => onOpenActivity(a.id)}
                actionLabel={`Open ${a.name}`}
                leading={<ListAvatar icon={TYPE_ICON[a.type] ?? mdiShoeSneaker} />}
                primary={a.name}
                secondary={
                  <>
                    {format(parseLocal(a.date), 'EEE d MMM yyyy')}
                    <br />
                    <span className="tabular-nums">
                      {(a.distanceM / 1000).toFixed(2)} km · {formatDuration(a.movingS)} · {speedOrPace(a)}
                    </span>
                  </>
                }
                trailingIsButton
                trailing={raceCell(a)}
              />
            ))}
          </ul>
        )}

        {filtered.length > 0 && (
          <>
            {!wide && <hr className="border-0 border-t border-on-surface/12" />}
            <Pagination
              page={currentPage}
              pageSize={pageSize}
              total={filtered.length}
              onPageChange={(p) => {
                setPage(p)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              pageSizeOptions={PAGE_SIZES}
              onPageSizeChange={(size) => {
                setPageSize(size)
                setPage(0)
              }}
            />
          </>
        )}
      </Card>

      <BottomSheet open={sortSheetOpen} onClose={() => setSortSheetOpen(false)} title="Sort by">
        <ul role="radiogroup" aria-label="Sort by">
          {SORT_OPTIONS.map((o) => {
            const selected = o.key === sort.key && o.dir === sort.dir
            return (
              <li key={o.label}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  data-ripple
                  onClick={() => {
                    setSort({ key: o.key, dir: o.dir })
                    setPage(0)
                    setSortSheetOpen(false)
                  }}
                  className={cx(
                    'state-layer type-body1 flex h-12 w-full items-center gap-8 px-4 text-left',
                    selected ? 'text-primary' : 'text-on-surface/87',
                  )}
                >
                  <Icon
                    path={selected ? mdiRadioboxMarked : mdiRadioboxBlank}
                    className={selected ? 'text-primary' : 'text-on-surface/60'}
                  />
                  {o.label}
                </button>
              </li>
            )
          })}
        </ul>
      </BottomSheet>
    </>
  )
}
