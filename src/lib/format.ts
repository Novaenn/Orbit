/** 1234 -> "20:34", 3725 -> "1:02:05" */
export function formatDuration(totalSeconds: number): string {
  const s = Math.round(totalSeconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`
}

/** 3725 -> "1h 02m", 1500 -> "25m" */
export function formatHours(totalSeconds: number): string {
  const minutes = Math.round(totalSeconds / 60)
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  return `${h}h ${String(m).padStart(2, '0')}m`
}

/** Seconds per km -> "5:30" */
export function formatPace(secPerKm: number | null | undefined): string {
  if (!secPerKm || !Number.isFinite(secPerKm)) return '–'
  const s = Math.round(secPerKm)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export function paceFrom(distanceM: number, seconds: number): number | null {
  if (distanceM <= 0 || seconds <= 0) return null
  return seconds / (distanceM / 1000)
}

export function formatKm(meters: number, digits = 1): string {
  return (meters / 1000).toFixed(digits)
}

export function formatSigned(n: number, digits = 0): string {
  const v = n.toFixed(digits)
  return n > 0 ? `+${v}` : v
}
