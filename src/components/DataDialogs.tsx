import { format } from 'date-fns'
import { parseLocal } from '../lib/dates'
import type { Activity, DataMeta, RaceOverrides } from '../lib/types'
import { Button } from '../md/Button'
import { Dialog } from '../md/Dialog'

export function DataDetailsDialog({
  open,
  onClose,
  onUpload,
  meta,
  activities,
  overrides,
}: {
  open: boolean
  onClose: () => void
  onUpload: () => void
  meta: DataMeta
  activities: Activity[]
  overrides: RaceOverrides
}) {
  const types = new Map<string, number>()
  for (const a of activities) types.set(a.type, (types.get(a.type) ?? 0) + 1)
  const newest = activities[0]
  const oldest = activities.at(-1)
  const tagged = Object.keys(overrides).length

  const rows: [string, string][] = [
    ['File', meta.fileName],
    [
      'Activities',
      `${activities.length} (${[...types.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([t, n]) => `${n} ${t.toLowerCase()}`)
        .join(', ')})`,
    ],
    [
      'Period',
      newest && oldest
        ? `${format(parseLocal(oldest.date), 'd MMM yyyy')} – ${format(parseLocal(newest.date), 'd MMM yyyy')}`
        : '–',
    ],
    ['Imported', format(new Date(meta.importedAt), 'd MMM yyyy, HH:mm')],
    ['Race tags', tagged === 0 ? 'None, automatic detection only' : `${tagged} changed by you`],
  ]

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Data details"
      actions={
        <>
          <Button
            onClick={() => {
              onClose()
              onUpload()
            }}
          >
            Upload new CSV
          </Button>
          <Button onClick={onClose} data-autofocus>
            Close
          </Button>
        </>
      }
    >
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-2">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="type-body2 text-on-surface/60">{k}</dt>
            <dd className="type-body2 break-words text-on-surface/87">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="type-caption mt-4">Everything is stored only in this browser.</p>
    </Dialog>
  )
}

export function ClearDataDialog({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Clear imported data?"
      actions={
        <>
          <Button onClick={onClose} data-autofocus>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onClose()
              onConfirm()
            }}
            tone="error"
          >
            Clear
          </Button>
        </>
      }
    >
      Your activities and race tags will be removed from this device. You can upload the CSV again at any time.
    </Dialog>
  )
}
