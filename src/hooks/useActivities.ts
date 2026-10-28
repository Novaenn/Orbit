import { useCallback, useMemo, useState } from 'react'
import { parseActivitiesCsv } from '../lib/parseCsv'
import { isAutoRace, isRace } from '../lib/races'
import { DATA_VERSION, storage } from '../lib/storage'
import type { Activity, DataMeta, RaceOverrides } from '../lib/types'

export function useActivities() {
  const [data, setData] = useState(() => storage.loadData())
  const [overrides, setOverrides] = useState<RaceOverrides>(() => storage.loadOverrides())
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  /** Returns the number of imported activities, or null if the file couldn't be read. */
  const importFile = useCallback(async (file: File): Promise<number | null> => {
    setLoading(true)
    setError(null)
    try {
      const activities = parseActivitiesCsv(await file.text())
      const meta: DataMeta = {
        fileName: file.name,
        importedAt: new Date().toISOString(),
        version: DATA_VERSION,
      }
      storage.saveData(activities, meta)
      setData({ activities, meta })
      // Keep race tags only for activities that still exist in the new file.
      setOverrides((prev) => {
        const ids = new Set(activities.map((a) => a.id))
        const kept = Object.fromEntries(Object.entries(prev).filter(([id]) => ids.has(id)))
        storage.saveOverrides(kept)
        return kept
      })
      return activities.length
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read this file.')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const clear = useCallback(() => {
    storage.clearAll()
    setData(null)
    setOverrides({})
    setError(null)
  }, [])

  const clearError = useCallback(() => setError(null), [])

  const toggleRace = useCallback((activity: Activity) => {
    setOverrides((prev) => {
      const next = { ...prev }
      const nowRace = !isRace(activity, prev)
      // Only store a tag when it differs from automatic detection.
      if (nowRace === isAutoRace(activity)) delete next[activity.id]
      else next[activity.id] = nowRace
      storage.saveOverrides(next)
      return next
    })
  }, [])

  const raceIds = useMemo(() => {
    const ids = new Set<string>()
    for (const a of data?.activities ?? []) if (isRace(a, overrides)) ids.add(a.id)
    return ids
  }, [data, overrides])

  return {
    activities: data?.activities ?? null,
    meta: data?.meta ?? null,
    overrides,
    raceIds,
    error,
    loading,
    /** Saved data from an older version is missing some of the fields the app now shows. */
    needsReimport: data ? (data.meta.version ?? 1) < DATA_VERSION : false,
    importFile,
    clear,
    clearError,
    toggleRace,
  }
}

export type ActivitiesState = ReturnType<typeof useActivities>
