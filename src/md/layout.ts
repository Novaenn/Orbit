import { useSyncExternalStore } from 'react'

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
  )
}

/**
 * Material breakpoint ranges:
 * compact 0–599 (bottom navigation), medium 600–1239 (navigation rail),
 * expanded 1240+ (navigation drawer).
 */
export type WindowClass = 'compact' | 'medium' | 'expanded'

export function useWindowClass(): WindowClass {
  const medium = useMediaQuery('(min-width: 600px)')
  const expanded = useMediaQuery('(min-width: 1240px)')
  return expanded ? 'expanded' : medium ? 'medium' : 'compact'
}

export function useIsCompact(): boolean {
  return useWindowClass() === 'compact'
}
