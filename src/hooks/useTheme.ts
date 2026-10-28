import { useCallback, useEffect, useState } from 'react'
import { storage } from '../lib/storage'

/** Browser UI colour matches the top app bar. */
const APP_BAR_COLOR = { light: '#3f51b5', dark: '#272727' }

export function useTheme() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    document
      .querySelectorAll('meta[name="theme-color"]')
      .forEach((m) => m.setAttribute('content', dark ? APP_BAR_COLOR.dark : APP_BAR_COLOR.light))
  }, [dark])

  const toggle = useCallback(() => {
    setDark((d) => {
      storage.saveTheme(d ? 'light' : 'dark')
      return !d
    })
  }, [])

  return { dark, toggle }
}
