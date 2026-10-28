import { createContext, use } from 'react'

export interface SnackbarOptions {
  message: string
  action?: { label: string; onAction: () => void }
  /** Milliseconds; Material recommends 4–10 seconds. */
  duration?: number
}

export const SnackbarContext = createContext<(options: SnackbarOptions) => void>(() => {})

export function useSnackbar() {
  return use(SnackbarContext)
}
