import { useEffect, useState } from 'react'

/**
 * Keeps an element mounted while its exit animation plays.
 * Returns `mounted` (render it) and `exiting` (apply the exit animation).
 */
export function usePresence(open: boolean, exitMs: number) {
  const [mounted, setMounted] = useState(open)
  const [exiting, setExiting] = useState(false)

  // Adjust state while rendering when `open` changes (React's recommended pattern).
  if (open && !mounted) setMounted(true)
  if (open && exiting) setExiting(false)
  if (!open && mounted && !exiting) setExiting(true)

  useEffect(() => {
    if (!exiting) return
    const timer = window.setTimeout(() => {
      setMounted(false)
      setExiting(false)
    }, exitMs)
    return () => window.clearTimeout(timer)
  }, [exiting, exitMs])

  return { mounted, exiting }
}
