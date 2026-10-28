import { mdiAlertCircleOutline, mdiCheckCircleOutline, mdiChevronDown, mdiInformationOutline } from '@mdi/js'
import { format } from 'date-fns'
import { useId, useState } from 'react'
import { parseLocal } from '../../lib/dates'
import { formatDuration, formatPace } from '../../lib/format'
import type { PersonalBest } from '../../lib/pbs'
import {
  DEFAULT_RIEGEL_EXPONENT,
  type Confidence,
  type Prediction,
  type PredictionResult,
} from '../../lib/predict'
import { Button, IconButton } from '../../md/Button'
import { Card } from '../../md/Card'
import { ChoiceChips } from '../../md/Chips'
import { cx } from '../../md/cx'
import { Dialog } from '../../md/Dialog'
import { Icon } from '../../md/Icon'
import { useMediaQuery } from '../../md/layout'

const WINDOW_CHIPS = [
  { value: 6, label: '6 weeks' },
  { value: 12, label: '12 weeks' },
  { value: 26, label: '6 months' },
  { value: 52, label: '1 year' },
]

const CONFIDENCE: Record<Confidence, { label: string; icon: string; className: string }> = {
  high: { label: 'High confidence', icon: mdiCheckCircleOutline, className: 'text-success' },
  medium: { label: 'Medium confidence', icon: mdiAlertCircleOutline, className: 'text-warning' },
  low: { label: 'Low confidence', icon: mdiAlertCircleOutline, className: 'text-error' },
}

export function RacePrediction({
  result,
  windowWeeks,
  onWindowChange,
  pbs,
  onGoToActivities,
}: {
  result: PredictionResult
  windowWeeks: number
  onWindowChange: (weeks: number) => void
  pbs: PersonalBest[]
  onGoToActivities: () => void
}) {
  const [infoOpen, setInfoOpen] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  // Cards side by side expand together so the row stays aligned; stacked cards expand on their own.
  const sideBySide = useMediaQuery('(min-width: 905px)')
  const toggle = (key: string) =>
    setExpanded((prev) => {
      const open = !prev.has(key)
      if (sideBySide) return open ? new Set(result.predictions.map((p) => p.target.key)) : new Set()
      const next = new Set(prev)
      if (open) next.add(key)
      else next.delete(key)
      return next
    })
  const count = result.windowRaces.length
  const windowLabel = WINDOW_CHIPS.find((c) => c.value === windowWeeks)?.label ?? `${windowWeeks} weeks`

  return (
    <section aria-labelledby="prediction-title">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-1">
          <div>
            <h2 id="prediction-title" className="type-h6 text-on-surface/87">
              Race prediction
            </h2>
            <p className="type-body2 text-on-surface/60">
              {count > 0
                ? `From ${count} race${count === 1 ? '' : 's'} in the last ${windowLabel}`
                : `No races in the last ${windowLabel}`}
              {result.vdot !== null && ` · VDOT ${result.vdot.toFixed(1)}`}
            </p>
          </div>
          <IconButton
            icon={mdiInformationOutline}
            label="How predictions work"
            onClick={() => setInfoOpen(true)}
            className="-mt-2 text-on-surface/60"
          />
        </div>
        <ChoiceChips label="Use races from the last" value={windowWeeks} onChange={onWindowChange} options={WINDOW_CHIPS} />
      </div>

      {count === 0 ? (
        <Card className="flex flex-col items-center px-6 py-10 text-center">
          <p className="type-subtitle1 text-on-surface/87">Nothing to predict from yet</p>
          <p className="type-body2 mt-1 text-on-surface/60">
            There are no races in this period. Choose a longer period, or mark a run as a race.
          </p>
          <Button className="mt-4" onClick={onGoToActivities}>
            Go to activities
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
          {result.predictions.map((p) => (
            <PredictionCard
              key={p.target.key}
              prediction={p}
              expanded={expanded.has(p.target.key)}
              onToggle={() => toggle(p.target.key)}
              pb={pbs.find((pb) => Math.abs(pb.distance.distanceM - p.target.distanceM) < 1)}
            />
          ))}
        </div>
      )}

      <Dialog
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        title="How predictions work"
        actions={
          <Button onClick={() => setInfoOpen(false)} data-autofocus>
            Got it
          </Button>
        }
      >
        <p>
          Each prediction blends two well-known models, using your races from the selected period. Race times use
          clock (elapsed) time.
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>
            <span className="font-medium text-on-surface/87">Riegel formula</span>: scales a race time to another
            distance. Your fatigue factor is{' '}
            <span className="font-medium text-on-surface/87 tabular-nums">{result.exponent.toFixed(3)}</span>
            {result.exponentFitted
              ? ', fitted to your own races.'
              : ` (the standard ${DEFAULT_RIEGEL_EXPONENT}; it becomes personal once you have races of different distances).`}
          </li>
          <li>
            <span className="font-medium text-on-surface/87">Jack Daniels' VDOT</span>: a fitness score from each
            race, converted back to a time for the target distance.
          </li>
          <li>Newer races count more (their weight halves every 4 weeks), and so do races close to the target distance.</li>
        </ul>
      </Dialog>
    </section>
  )
}

function PredictionCard({
  prediction: p,
  pb,
  expanded,
  onToggle,
}: {
  prediction: Prediction
  pb: PersonalBest | undefined
  expanded: boolean
  onToggle: () => void
}) {
  const detailsId = useId()
  const conf = CONFIDENCE[p.confidence]
  const diff = pb?.seconds ? p.seconds - pb.seconds : null

  return (
    <Card className="flex flex-col">
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="type-overline text-on-surface/60">{p.target.label}</h3>
          <span className={cx('type-caption flex items-center gap-1', conf.className)}>
            <Icon path={conf.icon} size={16} />
            {conf.label}
          </span>
        </div>
        <div className="type-h3 mt-1 tabular-nums text-on-surface/87">{formatDuration(p.seconds)}</div>
        <div className="type-body2 mt-1 text-on-surface/60 tabular-nums">
          {formatPace(p.pace)} /km · likely {formatDuration(p.low)}–{formatDuration(p.high)}
        </div>
      </div>

      <hr className="border-0 border-t border-on-surface/12" />

      <div className="type-body2 px-4 py-3">
        {pb?.race && pb.seconds ? (
          <p className="text-on-surface/87">
            PB <span className="font-medium tabular-nums">{formatDuration(pb.seconds)}</span>
            <span className="text-on-surface/60"> · {format(parseLocal(pb.race.date), 'MMM yyyy')}</span>
            {diff !== null && Math.abs(diff) >= 1 && (
              <span className={cx('ml-1 font-medium', diff < 0 ? 'text-success' : 'text-on-surface/60')}>
                ({diff < 0 ? '−' : '+'}
                {formatDuration(Math.abs(diff))})
              </span>
            )}
          </p>
        ) : (
          <p className="text-on-surface/60">No {p.target.label} race yet</p>
        )}
        <ul className="type-caption mt-1 text-on-surface/60">
          {p.reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </div>

      <div className="mt-auto flex items-center justify-between px-2 pb-2">
        <Button
          aria-expanded={expanded}
          aria-controls={detailsId}
          onClick={onToggle}
        >
          {expanded ? 'Hide details' : 'Details'}
        </Button>
        <IconButton
          icon={mdiChevronDown}
          label={expanded ? 'Hide details' : 'Show details'}
          tooltip={false}
          aria-expanded={expanded}
          aria-controls={detailsId}
          onClick={onToggle}
          className={cx('text-on-surface/60 transition-transform duration-200 ease-standard', expanded && 'rotate-180')}
        />
      </div>

      {expanded && (
        <div id={detailsId} className="md-enter-fade">
          <hr className="border-0 border-t border-on-surface/12" />
          <ul className="px-4 py-3">
            {p.basis.map((b) => (
              <li key={b.activity.id} className="py-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="type-body2 truncate text-on-surface/87">{b.activity.name}</span>
                  <span className="type-subtitle2 shrink-0 tabular-nums text-on-surface/87">
                    {Math.round(b.share * 100)}%
                  </span>
                </div>
                <div className="type-caption text-on-surface/60 tabular-nums">
                  {format(parseLocal(b.activity.date), 'd MMM')} · {(b.activity.distanceM / 1000).toFixed(2)} km in{' '}
                  {formatDuration(b.raceSeconds)}
                </div>
                <div className="type-caption text-on-surface/60 tabular-nums">
                  Riegel {formatDuration(b.riegelSeconds)} · VDOT {formatDuration(b.vdotSeconds)}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}
