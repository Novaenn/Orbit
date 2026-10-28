import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { SnackbarContext, type SnackbarOptions } from './snackbarContext'
import { cx } from './cx'

interface QueuedSnackbar extends SnackbarOptions {
  id: number
}

let nextId = 0

/**
 * Material snackbars: one at a time at the bottom of the screen, above bottom navigation.
 * They disappear on their own after 4–10 seconds; a newer message replaces the current one.
 */
export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<QueuedSnackbar[]>([])
  const [exiting, setExiting] = useState(false)
  const current = queue[0]
  const hasNext = queue.length > 1

  const show = useCallback((options: SnackbarOptions) => {
    setQueue((q) => [...q, { ...options, id: ++nextId }])
  }, [])

  useEffect(() => {
    if (!current) return
    const duration = hasNext ? 0 : (current.duration ?? (current.action ? 8000 : 5000))
    const timer = window.setTimeout(() => setExiting(true), duration)
    return () => window.clearTimeout(timer)
  }, [current, hasNext])

  useEffect(() => {
    if (!exiting) return
    const timer = window.setTimeout(() => {
      setQueue((q) => q.slice(1))
      setExiting(false)
    }, 75)
    return () => window.clearTimeout(timer)
  }, [exiting])

  return (
    <SnackbarContext value={show}>
      {children}
      {createPortal(
        <div className="md-snackbar-host pointer-events-none fixed z-[60] flex justify-center sm:justify-start" role="status" aria-live="polite">
          {current && (
            <div
              key={current.id}
              className={cx(
                'type-body2 pointer-events-auto flex min-h-12 w-full items-center gap-2 rounded bg-snackbar py-1.5 pr-2 pl-4 text-on-snackbar shadow-e6 sm:w-auto sm:max-w-[672px] sm:min-w-[344px]',
                exiting ? 'md-exit-fade' : 'md-enter-scale',
              )}
            >
              <span className="min-w-0 flex-1 py-1.5 line-clamp-2">{current.message}</span>
              {current.action && (
                <button
                  type="button"
                  data-ripple
                  onClick={() => {
                    current.action!.onAction()
                    setExiting(true)
                  }}
                  className="state-layer type-button h-9 shrink-0 rounded px-2 text-snackbar-action"
                >
                  {current.action.label}
                </button>
              )}
            </div>
          )}
        </div>,
        document.body,
      )}
    </SnackbarContext>
  )
}
