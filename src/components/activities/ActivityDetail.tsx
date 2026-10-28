import {
  mdiBike,
  mdiFire,
  mdiHeartPulse,
  mdiHiking,
  mdiNoteTextOutline,
  mdiRun,
  mdiShoeSneaker,
  mdiTerrain,
  mdiWalk,
} from '@mdi/js'
import { format } from 'date-fns'
import type { ReactNode } from 'react'
import { isRun } from '../../lib/activities'
import { parseLocal } from '../../lib/dates'
import { formatDuration, formatHours, formatPace, paceFrom } from '../../lib/format'
import { zoneBreakdown } from '../../lib/hrZones'
import { vdotFromPerformance } from '../../lib/predict'
import { raceTime } from '../../lib/races'
import { RUN_TYPES, classifyRun } from '../../lib/runTypes'
import type { Activity } from '../../lib/types'
import { cx } from '../../md/cx'
import { DetailDialog } from '../../md/DetailDialog'
import { Divider } from '../../md/Card'
import { Icon } from '../../md/Icon'
import { RaceToggle } from '../races/RaceToggle'

const TYPE_ICON: Record<string, string> = { Run: mdiRun, Ride: mdiBike, Hike: mdiHiking, Walk: mdiWalk }

/** Material zone colours: cool for easy, warm for hard. */
const ZONE_COLORS = [
  'bg-sky-300 dark:bg-sky-700',
  'bg-teal-400 dark:bg-teal-600',
  'bg-green-500 dark:bg-green-600',
  'bg-yellow-500 dark:bg-yellow-600',
  'bg-orange-500 dark:bg-orange-600',
  'bg-red-500 dark:bg-red-600',
  'bg-purple-600 dark:bg-purple-500',
]

export function ActivityDetail({
  activity,
  isRace,
  onToggleRace,
  onClose,
}: {
  activity: Activity | null
  isRace: boolean
  onToggleRace: (a: Activity) => void
  onClose: () => void
}) {
  return (
    <DetailDialog
      open={activity !== null}
      onClose={onClose}
      title={activity?.name ?? ''}
      subtitle={activity ? format(parseLocal(activity.date), 'EEEE d MMMM yyyy, HH:mm') : undefined}
      action={
        activity && isRun(activity) ? (
          <RaceToggle isRace={isRace} name={activity.name} onToggle={() => onToggleRace(activity)} />
        ) : undefined
      }
    >
      {activity && <DetailBody activity={activity} isRace={isRace} />}
    </DetailDialog>
  )
}

function DetailBody({ activity: a, isRace }: { activity: Activity; isRace: boolean }) {
  const run = isRun(a)
  const pace = paceFrom(a.distanceM, a.movingS)
  const speedKmh = a.movingS > 0 ? (a.distanceM / a.movingS) * 3.6 : null
  const zones = zoneBreakdown(a)
  const runType = classifyRun(a)
  const runTypeLabel = RUN_TYPES.find((t) => t.value === runType)?.label
  const vdot = isRace && a.distanceM >= 1500 ? vdotFromPerformance(a.distanceM, raceTime(a)) : null

  return (
    <div className="pb-6">
      <div className="flex items-center gap-3 px-4 pt-4">
        <Icon path={TYPE_ICON[a.type] ?? mdiShoeSneaker} className="text-on-surface/60" />
        <span className="type-body2 text-on-surface/60">{a.type}</span>
        {runTypeLabel && (
          <span
            className={cx(
              'type-caption rounded-full px-2 py-0.5',
              isRace ? 'bg-secondary/16 text-secondary' : 'bg-primary/12 text-primary',
            )}
          >
            {runTypeLabel}
          </span>
        )}
      </div>

      {/* Headline numbers */}
      <div className="grid grid-cols-3 gap-2 px-4 pt-3 pb-4">
        <Headline label="Distance" value={(a.distanceM / 1000).toFixed(2)} unit="km" />
        <Headline label="Moving time" value={formatDuration(a.movingS)} />
        <Headline
          label={run ? 'Pace' : 'Speed'}
          value={run ? formatPace(pace) : (speedKmh?.toFixed(1) ?? '–')}
          unit={run ? '/km' : 'km/h'}
        />
      </div>

      <Divider />

      <dl className="grid grid-cols-1 gap-x-6 px-4 py-2 sm:grid-cols-2">
        <Stat label="Elapsed time" value={formatHours(a.elapsedS)} />
        <Stat label="Average HR" value={a.avgHr ? `${Math.round(a.avgHr)} bpm` : null} />
        <Stat label="Max HR" value={a.maxHr ? `${Math.round(a.maxHr)} bpm` : null} />
        <Stat label="Training load" value={a.load !== null ? String(Math.round(a.load)) : null} />
        <Stat label="Intensity" value={a.intensity !== null ? `${Math.round(a.intensity)}%` : null} />
        <Stat label="Cadence" value={a.cadenceSpm ? `${Math.round(a.cadenceSpm)} spm` : null} />
        <Stat
          label="Elevation"
          value={a.elevationM !== null ? `${Math.round(a.elevationM)} m` : null}
          icon={mdiTerrain}
        />
        <Stat label="Calories" value={a.calories ? `${Math.round(a.calories)} kcal` : null} icon={mdiFire} />
        <Stat
          label="HR recovery"
          value={a.hrRecovery ? `−${Math.round(a.hrRecovery)} bpm` : null}
          hint={a.hrRecovery && a.hrRecoveryFrom ? `in 1 min, from ${Math.round(a.hrRecoveryFrom)}` : undefined}
          icon={mdiHeartPulse}
        />
        {vdot !== null && <Stat label="VDOT" value={vdot.toFixed(1)} />}
        {a.gear && <Stat label="Shoes" value={a.gear} icon={mdiShoeSneaker} />}
      </dl>

      {zones && (
        <>
          <Divider className="mt-2" />
          <section className="px-4 py-4">
            <h3 className="type-subtitle2 mb-3 text-on-surface/87">Heart-rate zones</h3>
            <div className="flex h-3 overflow-hidden rounded-full" role="presentation">
              {zones.map((z) => (
                <span
                  key={z.name}
                  className={cx(ZONE_COLORS[z.index], z.share === 0 && 'hidden')}
                  style={{ width: `${z.share * 100}%` }}
                />
              ))}
            </div>
            <ul className="mt-3 grid gap-x-6 sm:grid-cols-2">
              {zones
                .filter((z) => z.seconds > 0)
                .map((z) => (
                  <li key={z.name} className="type-body2 flex items-center gap-2 py-0.5">
                    <span className={cx('size-2.5 shrink-0 rounded-sm', ZONE_COLORS[z.index])} />
                    <span className="text-on-surface/87">{z.name}</span>
                    {z.range && <span className="type-caption text-on-surface/60">{z.range} bpm</span>}
                    <span className="ml-auto tabular-nums text-on-surface/87">{formatDuration(z.seconds)}</span>
                    <span className="type-caption w-9 text-right tabular-nums text-on-surface/60">
                      {Math.round(z.share * 100)}%
                    </span>
                  </li>
                ))}
            </ul>
          </section>
        </>
      )}

      {a.description && (
        <>
          <Divider />
          <section className="px-4 py-4">
            <h3 className="type-subtitle2 mb-2 flex items-center gap-2 text-on-surface/87">
              <Icon path={mdiNoteTextOutline} size={18} className="text-on-surface/60" />
              Notes
            </h3>
            <p className="type-body2 whitespace-pre-wrap text-on-surface/87">{a.description}</p>
          </section>
        </>
      )}
    </div>
  )
}

function Headline({ label, value, unit }: { label: string; value: ReactNode; unit?: string }) {
  return (
    <div className="min-w-0">
      <div className="type-caption truncate text-on-surface/60">{label}</div>
      <div className="type-h5 truncate tabular-nums text-on-surface/87">
        {value}
        {unit && <span className="type-body2 ml-0.5 text-on-surface/60">{unit}</span>}
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  hint,
  icon,
}: {
  label: string
  value: string | null
  hint?: string
  icon?: string
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 border-b border-on-surface/12 py-2.5 last:border-b-0">
      {icon && <Icon path={icon} size={18} className="shrink-0 text-on-surface/38" />}
      <dt className="type-body2 shrink-0 text-on-surface/60">{label}</dt>
      <dd className="type-body2 ml-auto min-w-0 text-right tabular-nums break-words text-on-surface/87">
        {value ?? <span className="text-on-surface/38">–</span>}
        {hint && value && <span className="type-caption block text-on-surface/60">{hint}</span>}
      </dd>
    </div>
  )
}
