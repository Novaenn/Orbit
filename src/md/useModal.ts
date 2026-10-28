import { useEffect, useEffectEvent, type RefObject } from 'react'

const FOCUSABLE =
  'button:not(:disabled), [href], input:not(:disabled), select, textarea, [tabindex]:not([tabindex="-1"])'

/**
 * Modal surface behaviour: moves focus inside, traps Tab, closes on Escape,
 * locks page scroll, and returns focus to the opener when closed.
 */
export function useModal(open: boolean, ref: RefObject<HTMLElement | null>, onClose: () => void) {
  const close = useEffectEvent(onClose)

  useEffect(() => {
    if (!open) return
    const opener = document.activeElement as HTMLElement | null
    const surface = ref.current
    const initial =
      surface?.querySelector<HTMLElement>('[data-autofocus]') ?? surface?.querySelector<HTMLElement>(FOCUSABLE)
    ;(initial ?? surface)?.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
        return
      }
      if (e.key !== 'Tab' || !surface) return
      const items = [...surface.querySelectorAll<HTMLElement>(FOCUSABLE)]
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    // Lock page scroll; pad for the scrollbar so the layout doesn't jump.
    const { style } = document.body
    const previous = { overflow: style.overflow, paddingRight: style.paddingRight }
    const scrollbar = window.innerWidth - document.documentElement.clientWidth
    style.overflow = 'hidden'
    if (scrollbar > 0) style.paddingRight = `${scrollbar}px`
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      style.overflow = previous.overflow
      style.paddingRight = previous.paddingRight
      opener?.focus?.()
    }
  }, [open, ref])
}
