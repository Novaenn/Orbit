import { useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cx } from './cx'
import { useModal } from './useModal'
import { usePresence } from './usePresence'

/**
 * Material dialog: 24dp elevation over a scrim, max 560dp wide,
 * fades in/out, dismissed by the scrim, Escape or a dismissive action.
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
  actions,
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  children: ReactNode
  actions: ReactNode
}) {
  const { mounted, exiting } = usePresence(open, 75)
  const ref = useRef<HTMLDivElement>(null)
  const titleId = useId()
  useModal(open, ref, onClose)

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div
        className={cx('absolute inset-0 bg-scrim', exiting ? 'md-exit-fade' : 'md-enter-fade')}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cx(
          'relative flex max-h-full w-full max-w-[560px] min-w-[280px] flex-col rounded bg-surface-24 shadow-e24 outline-none sm:w-auto sm:min-w-[400px]',
          exiting ? 'md-exit-fade' : 'md-enter-scale',
        )}
      >
        <h2 id={titleId} className="type-h6 px-6 pt-5 pb-3 text-on-surface/87">
          {title}
        </h2>
        <div className="type-body1 min-h-0 overflow-y-auto px-6 pb-5 text-on-surface/60">{children}</div>
        <div className="flex flex-wrap items-center justify-end gap-2 p-2">{actions}</div>
      </div>
    </div>,
    document.body,
  )
}
