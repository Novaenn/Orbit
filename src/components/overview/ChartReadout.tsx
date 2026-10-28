import type { ReactNode } from 'react'

export interface ReadoutValue {
  label: string
  value: ReactNode
  color?: string
}

/**
 * Values shown above a chart. With nothing selected it summarises the chart;
 * while hovering or touching it shows the selected point (Material progressive disclosure).
 */
export function ChartReadout({ heading, values }: { heading: ReactNode; values: ReadoutValue[] }) {
  return (
    <div className="px-4 pb-2" aria-live="polite">
      <div className="type-overline leading-6 text-on-surface/60">{heading}</div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4 sm:gap-2">
        {values.map((v) => (
          <div key={v.label} className="min-w-0">
            <dt className="type-caption flex items-center gap-1.5 truncate text-on-surface/60">
              {v.color && <span className="h-1 w-3 shrink-0 rounded-full" style={{ background: v.color }} />}
              {v.label}
            </dt>
            <dd className="type-h6 truncate tabular-nums text-on-surface/87">{v.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
