import type { ReactNode } from 'react'
import { cx } from './cx'

/** Material toggle buttons: a group of related options with one selected. */
export function ToggleButtonGroup<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: ReactNode }[]
  value: T
  onChange: (value: T) => void
  label: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex overflow-hidden rounded border border-on-surface/12"
    >
      {options.map((o, i) => {
        const selected = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            data-ripple
            onClick={() => onChange(o.value)}
            className={cx(
              'state-layer type-button h-9 min-w-12 px-3 transition-colors duration-150',
              i > 0 && 'border-l border-on-surface/12',
              selected ? 'bg-primary/12 text-primary dark:bg-primary/20' : 'text-on-surface/60',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
