import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useSnackbar } from '../md/snackbarContext'

/**
 * Registers the service worker and tells the user when Orbit is ready offline or
 * when a newer version is waiting to take over.
 */
export function PwaUpdate() {
  const showSnackbar = useSnackbar()
  const {
    needRefresh: [needRefresh],
    offlineReady: [offlineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error) {
      console.error('Orbit service worker registration failed', error)
    },
  })

  useEffect(() => {
    if (!offlineReady) return
    showSnackbar({ message: 'Orbit is ready to work offline.' })
  }, [offlineReady, showSnackbar])

  useEffect(() => {
    if (!needRefresh) return
    showSnackbar({
      message: 'A new version of Orbit is available.',
      action: { label: 'Reload', onAction: () => void updateServiceWorker(true) },
      duration: 20_000,
    })
  }, [needRefresh, showSnackbar, updateServiceWorker])

  return null
}
