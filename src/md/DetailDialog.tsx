import { mdiArrowLeft, mdiClose } from '@mdi/js'
import { useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { IconButton } from './Button'
import { cx } from './cx'
import { useIsCompact } from './layout'
import { useModal } from './useModal'
import { usePresence } from './usePresence'

/**
 * Material full-screen dialog on phones, centred dialog from 600dp up.
 * Used for showing the details behind a list item.
 */
export function DetailDialog({
  open,
  onClose,
  title,
  subtitle,
  action,
  children,
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  children: ReactNode
}) {
  const compact = useIsCompact()
  const { mounted, exiting } = usePresence(open, compact ? 195 : 75)
  const ref = useRef<HTMLDivElement>(null)
  const titleId = useId()
  useModal(open, ref, onClose)

  if (!mounted) return null

  const header = (
    <div
      className={cx(
        'flex shrink-0 items-center gap-1 pr-1 pl-1',
        compact ? 'h-14 bg-app-bar text-on-app-bar shadow-e4 sm:h-16' : 'h-16 pl-2',
      )}
    >
      <IconButton
        icon={compact ? mdiArrowLeft : mdiClose}
        label="Close"
        tooltip={false}
        onClick={onClose}
        data-autofocus
      />
      <div className="min-w-0 flex-1">
        <h2 id={titleId} className="type-h6 truncate">
          {title}
        </h2>
        {subtitle && (
          <p className={cx('type-caption truncate', compact ? 'text-on-app-bar/87' : 'text-on-surface/60')}>{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  )

  return createPortal(
    <div className={cx('fixed inset-0 z-50', !compact && 'flex items-center justify-center p-6')}>
      {!compact && (
        <div
          className={cx('absolute inset-0 bg-scrim', exiting ? 'md-exit-fade' : 'md-enter-fade')}
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cx(
          'relative flex flex-col overflow-hidden bg-surface outline-none',
          compact
            ? cx('h-full w-full pt-[env(safe-area-inset-top)]', exiting ? 'md-exit-sheet' : 'md-enter-sheet')
            : cx(
                'max-h-full w-full max-w-[560px] rounded bg-surface-24 shadow-e24',
                exiting ? 'md-exit-fade' : 'md-enter-scale',
              ),
        )}
      >
        {header}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  )
}
