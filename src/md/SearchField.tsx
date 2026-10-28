import { mdiClose, mdiMagnify } from '@mdi/js'
import { IconButton } from './Button'
import { Icon } from './Icon'

/** Outlined text field used for search, with a leading search icon and a clear button. */
export function SearchField({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  label: string
}) {
  return (
    <div className="relative flex h-12 items-center rounded ring-1 ring-on-surface/38 transition-shadow duration-150 ring-inset focus-within:ring-2 focus-within:ring-primary hover:ring-on-surface/87 focus-within:hover:ring-primary">
      <Icon path={mdiMagnify} className="pointer-events-none absolute left-3 text-on-surface/60" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="type-body1 h-full w-full min-w-0 rounded bg-transparent pr-12 pl-12 text-on-surface/87 outline-none placeholder:text-on-surface/60 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <IconButton
          icon={mdiClose}
          label="Clear search"
          tooltip={false}
          onClick={() => onChange('')}
          className="absolute right-0 text-on-surface/60"
        />
      )}
    </div>
  )
}
