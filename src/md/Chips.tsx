import type { ReactNode } from 'react'
import { cx } from './cx'

const CHIP =
  'state-layer type-body2 inline-flex h-8 shrink-0 items-center gap-2 rounded-full px-3 whitespace-nowrap select-none transition-colors duration-150'
const CHIP_OFF = 'bg-on-surface/[0.08] text-on-surface/87'
const CHIP_ON = 'bg-primary/16 text-primary dark:bg-primary/24'

export interface ChipOption<T extends string | number> {
  value: T
  label: ReactNode
}

/** Choice chips: a single selection from a small set. */
export function ChoiceChips<T extends string | number>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: ChipOption<T>[]
  value: T
  onChange: (value: T) => void
  label: string
  className?: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cx('flex flex-wrap gap-2', className)}>
      {options.map((o) => {
        const selected = o.value === value
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={selected}
            data-ripple
            onClick={() => onChange(o.value)}
            className={cx(CHIP, selected ? CHIP_ON : CHIP_OFF)}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

