import { useId, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cx } from './cx'
import { useModal } from './useModal'
import { usePresence } from './usePresence'

/** Modal bottom sheet (mobile): slides up over a scrim, swipe down or tap the scrim to dismiss. */
export function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  const { mounted, exiting } = usePresence(open, 195)
  const ref = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const [drag, setDrag] = useState<{ startY: number; dy: number } | null>(null)
  useModal(open, ref, onClose)

  if (!mounted) return null

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse') return
    e.currentTarget.setPointerCapture(e.pointerId)
    setDrag({ startY: e.clientY, dy: 0 })
  }
  const onPointerMove = (e: PointerEvent) => {
    if (drag) setDrag({ ...drag, dy: Math.max(0, e.clientY - drag.startY) })
  }
  const onPointerUp = () => {
    if (drag && drag.dy > 80) onClose()
    setDrag(null)
  }

  return createPortal(
    <div className="fixed inset-0 z-50">
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
        style={drag ? { transform: `translateY(${drag.dy}px)` } : undefined}
        className={cx(
          'absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t bg-surface-16 pb-[env(safe-area-inset-bottom)] shadow-e16 outline-none',
          exiting ? 'md-exit-sheet' : !drag && 'md-enter-sheet',
        )}
      >
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="touch-none"
        >
          <h2 id={titleId} className="type-subtitle1 flex h-14 items-center px-4 text-on-surface/60">
            {title}
          </h2>
        </div>
        <div className="pb-2">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
