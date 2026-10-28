import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'

interface NavState<T extends string> {
  tab: T
  /** Activity shown in the detail view, from "#activities/<id>". */
  detailId: string | null
}

function readHash<T extends string>(tabs: readonly T[], fallback: T): NavState<T> {
  const [tabPart, idPart] = window.location.hash.slice(1).split('/')
  return {
    tab: (tabs as readonly string[]).includes(tabPart) ? (tabPart as T) : fallback,
    detailId: idPart ? decodeURIComponent(idPart) : null,
  }
}

function hashFor<T extends string>({ tab, detailId }: NavState<T>): string {
  return detailId ? `#${tab}/${encodeURIComponent(detailId)}` : `#${tab}`
}

/**
 * Top-level navigation:
 * - the URL hash, so reload and the browser back button work
 * - a fade-through transition between destinations
 * - each destination keeps its scroll position; re-selecting the current one scrolls to the top
 * - the detail view is a history entry, so Back (and Android's back gesture) closes it
 */
export function useNavigation<T extends string>(tabs: readonly T[], fallback: T) {
  const [nav, setNav] = useState<NavState<T>>(() => readHash(tabs, fallback))
  const navRef = useRef(nav)
  const scrollPositions = useRef<Partial<Record<T, number>>>({})
  const pendingScroll = useRef<number | null>(null)
  // True when this session pushed the detail entry, so closing can just go back.
  const pushedDetail = useRef(false)

  useLayoutEffect(() => {
    navRef.current = nav
    if (pendingScroll.current !== null) {
      window.scrollTo(0, pendingScroll.current)
      pendingScroll.current = null
    }
  }, [nav])

  const apply = useCallback((next: NavState<T>, history: 'push' | 'replace' | 'none') => {
    const current = navRef.current
    if (next.tab === current.tab && next.detailId === current.detailId) {
      if (!next.detailId) window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    const hash = hashFor(next)
    if (history === 'push') window.history.pushState(null, '', hash)
    else if (history === 'replace') window.history.replaceState(null, '', hash)

    const tabChanged = next.tab !== current.tab
    if (tabChanged) {
      scrollPositions.current[current.tab] = window.scrollY
      pendingScroll.current = scrollPositions.current[next.tab] ?? 0
    }

    const update = () => flushSync(() => setNav(next))
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // The detail view animates itself, so only switching destinations gets the page transition.
    if (tabChanged && document.startViewTransition && !reduceMotion) {
      const transition = document.startViewTransition(update)
      transition.ready.catch(() => {})
      transition.finished.catch(() => {})
    } else {
      update()
    }
  }, [])

  useEffect(() => {
    window.history.scrollRestoration = 'manual'
    const onPopState = () => {
      const next = readHash(tabs, fallback)
      if (!next.detailId) pushedDetail.current = false
      apply(next, 'none')
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [apply, tabs, fallback])

  const navigate = useCallback((tab: T) => apply({ tab, detailId: null }, 'push'), [apply])

  const openDetail = useCallback(
    (id: string) => {
      pushedDetail.current = true
      apply({ tab: navRef.current.tab, detailId: id }, 'push')
    },
    [apply],
  )

  const closeDetail = useCallback(() => {
    if (pushedDetail.current) {
      pushedDetail.current = false
      // Lets Back and the close button behave identically.
      window.history.back()
    } else {
      // Opened from a link or a reload: there's nothing to go back to.
      apply({ tab: navRef.current.tab, detailId: null }, 'replace')
    }
  }, [apply])

  /** Drops a detail id that doesn't match any activity. */
  const clearDetail = useCallback(() => {
    apply({ tab: navRef.current.tab, detailId: null }, 'replace')
  }, [apply])

  return { tab: nav.tab, detailId: nav.detailId, navigate, openDetail, closeDetail, clearDetail }
}
