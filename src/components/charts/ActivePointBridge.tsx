import { useEffect } from 'react'

/**
 * Rendered as a Recharts tooltip `content`: draws nothing, but reports the
 * hovered/touched data point so it can be shown in a readout above the chart
 * (Material: on mobile, details appear above the chart, not under the finger).
 */
export function ActivePointBridge<T>({
  active,
  payload,
  onChange,
}: {
  active?: boolean
  payload?: ReadonlyArray<{ payload?: unknown }>
  onChange: (point: T | null) => void
}) {
  const point = (active ? (payload?.[0]?.payload ?? null) : null) as T | null
  useEffect(() => {
    onChange(point)
  }, [point, onChange])
  useEffect(() => () => onChange(null), [onChange])
  return null
}
