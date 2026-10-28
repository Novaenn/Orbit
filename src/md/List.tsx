import type { ReactNode } from 'react'
import { cx } from './cx'
import { Icon } from './Icon'

/** Material list item (two-line 72dp with avatar, or three-line 88dp). */
export function ListItem({
  leading,
  primary,
  secondary,
  trailing,
  trailingIsButton,
  threeLine,
  onClick,
  actionLabel,
}: {
  leading?: ReactNode
  primary: ReactNode
  secondary?: ReactNode
  trailing?: ReactNode
  /** Icon buttons sit flush with the 16dp margin (their 48dp target overhangs it). */
  trailingIsButton?: boolean
  threeLine?: boolean
  /** Makes the whole item tappable; the title stays the focusable element. */
  onClick?: () => void
  actionLabel?: string
}) {
  return (
    <li
      className={cx(
        'relative flex gap-4 px-4',
        threeLine ? 'min-h-[88px] items-start py-3' : 'min-h-[72px] items-center py-2',
        onClick && 'state-layer cursor-pointer',
      )}
      data-ripple={onClick ? '' : undefined}
    >
      {leading}
      <div className="min-w-0 flex-1">
        <div className="type-subtitle1 truncate text-on-surface/87">
          {onClick ? (
            <button
              type="button"
              onClick={onClick}
              aria-label={actionLabel}
              className="block w-full truncate text-left before:absolute before:inset-0 before:content-['']"
            >
              {primary}
            </button>
          ) : (
            primary
          )}
        </div>
        {secondary && (
          <div className={cx('type-body2 text-on-surface/60', threeLine ? 'line-clamp-2' : 'truncate')}>{secondary}</div>
        )}
      </div>
      {trailing && (
        <div
          className={cx(
            'relative flex shrink-0 items-center',
            trailingIsButton && '-mr-3',
            threeLine && trailingIsButton && '-mt-1',
          )}
        >
          {trailing}
        </div>
      )}
    </li>
  )
}

export function ListAvatar({ icon, tone = 'primary' }: { icon: string; tone?: 'primary' | 'secondary' }) {
  return (
    <span
      className={cx(
        'flex size-10 shrink-0 items-center justify-center rounded-full',
        tone === 'primary' ? 'bg-primary/12 text-primary' : 'bg-secondary/16 text-secondary',
      )}
    >
      <Icon path={icon} />
    </span>
  )
}
