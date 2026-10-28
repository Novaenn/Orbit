import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { cx } from './cx'
import { Icon } from './Icon'
import { usePresence } from './usePresence'

export interface MenuItemSpec {
  label: string
  icon?: string
  selected?: boolean
  onSelect: () => void
}

/**
 * Material menu: a temporary 8dp surface anchored to its trigger.
 * Closes on selection, outside tap, Escape or Tab. Arrow keys move between items.
 */
export function Menu({
  open,
  onClose,
  trigger,
  items,
  label,
  align = 'end',
  placement = 'below',
}: {
  open: boolean
  onClose: () => void
  trigger: ReactNode
  items: MenuItemSpec[]
  label: string
  align?: 'start' | 'end'
  placement?: 'below' | 'above'
}) {
  const { mounted, exiting } = usePresence(open, 75)
  const listRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const menuItems = listRef.current?.querySelectorAll<HTMLElement>('[role^=menuitem]')
    const selected = listRef.current?.querySelector<HTMLElement>('[role^=menuitem][aria-checked=true]')
    ;(selected ?? menuItems?.[0])?.focus()
  }, [open])

  const focusTrigger = () => wrapperRef.current?.querySelector<HTMLElement>('button')?.focus()

  const onKeyDown = (e: KeyboardEvent) => {
    const menuItems = [...(listRef.current?.querySelectorAll<HTMLElement>('[role^=menuitem]') ?? [])]
    const index = menuItems.indexOf(document.activeElement as HTMLElement)
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const next = (index + (e.key === 'ArrowDown' ? 1 : -1) + menuItems.length) % menuItems.length
      menuItems[next]?.focus()
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault()
      menuItems[e.key === 'Home' ? 0 : menuItems.length - 1]?.focus()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
      focusTrigger()
    } else if (e.key === 'Tab') {
      onClose()
    }
  }

  return (
    <div ref={wrapperRef} className="relative inline-flex">
      {trigger}
      {mounted && (
        <>
          <div className="fixed inset-0 z-40" onPointerDown={onClose} aria-hidden="true" />
          <div
            ref={listRef}
            role="menu"
            aria-label={label}
            onKeyDown={onKeyDown}
            className={cx(
              'absolute z-50 min-w-28 rounded bg-surface-8 py-2 shadow-e8',
              placement === 'below' ? 'top-full mt-1' : 'bottom-full mb-1',
              align === 'end' ? 'right-0' : 'left-0',
              placement === 'below' ? (align === 'end' ? 'origin-top-right' : 'origin-top-left') : 'origin-bottom',
              exiting ? 'md-exit-fade' : 'md-enter-scale',
            )}
          >
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                role={item.selected === undefined ? 'menuitem' : 'menuitemradio'}
                aria-checked={item.selected}
                data-ripple
                tabIndex={-1}
                onClick={() => {
                  onClose()
                  item.onSelect()
                }}
                className={cx(
                  'state-layer type-body1 flex h-12 w-full items-center gap-4 px-4 text-left whitespace-nowrap',
                  item.selected ? 'bg-primary/12 text-primary' : 'text-on-surface/87',
                )}
              >
                {item.icon && <Icon path={item.icon} className={item.selected ? undefined : 'text-on-surface/60'} />}
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
