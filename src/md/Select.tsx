import { mdiMenuDown } from '@mdi/js'
import { cx } from './cx'
import { Icon } from './Icon'

export interface SelectOption<T extends string> {
  value: T
  label: string
}

/** Outlined dropdown, same height as the search field. */
export function Select<T extends string>({
  value,
  onChange,
  options,
  label,
  disabled,
  className,
}: {
  value: T
  onChange: (value: T) => void
  options: SelectOption<T>[]
  label: string
  disabled?: boolean
  className?: string
}) {
  return (
    <div
      className={cx(
        'relative flex h-12 items-center rounded ring-1 transition-shadow duration-150 ring-inset',
        disabled
          ? 'ring-on-surface/12'
          : 'ring-on-surface/38 focus-within:ring-2 focus-within:ring-primary hover:ring-on-surface/87 focus-within:hover:ring-primary',
        className,
      )}
    >
      <select
        value={value}
        disabled={disabled}
        aria-label={label}
        onChange={(e) => onChange(e.target.value as T)}
        className={cx(
          'type-body1 h-full w-full cursor-pointer appearance-none rounded bg-transparent pr-9 pl-3 outline-none',
          disabled ? 'cursor-default text-on-surface/38' : 'text-on-surface/87',
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <Icon
        path={mdiMenuDown}
        className={cx('pointer-events-none absolute right-2', disabled ? 'text-on-surface/38' : 'text-on-surface/60')}
      />
    </div>
  )
}
