import type { Activity, DataMeta, RaceOverrides } from './types'

/**
 * Bumped when the parser starts reading fields older saved data doesn't have.
 * v2 added heart-rate zone limits, cadence, calories, intensity, HR recovery and gear.
 * v3 added intervals.icu's threshold pace.
 */
export const DATA_VERSION = 3

const KEYS = {
  activities: 'orbit.activities.v1',
  meta: 'orbit.meta.v1',
  overrides: 'orbit.raceOverrides.v1',
  theme: 'orbit.theme',
} as const

/**
 * Keys from when the app was called Space Training. They are still read, and
 * cleared with the current ones, so existing local data survives the rename.
 */
const LEGACY_KEYS = {
  activities: 'st.activities.v1',
  meta: 'st.meta.v1',
  overrides: 'st.raceOverrides.v1',
  theme: 'st.theme',
} as const

type StorageKey = keyof typeof KEYS

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function readOrLegacy<T>(key: StorageKey): T | null {
  return read<T>(KEYS[key]) ?? read<T>(LEGACY_KEYS[key])
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage full or unavailable (e.g. private mode): the app still works for this session.
  }
}

export const storage = {
  loadData(): { activities: Activity[]; meta: DataMeta } | null {
    const activities = readOrLegacy<Activity[]>('activities')
    const meta = readOrLegacy<DataMeta>('meta')
    return activities && meta ? { activities, meta } : null
  },
  saveData(activities: Activity[], meta: DataMeta): void {
    write(KEYS.activities, activities)
    write(KEYS.meta, meta)
  },
  loadOverrides(): RaceOverrides {
    return readOrLegacy<RaceOverrides>('overrides') ?? {}
  },
  saveOverrides(overrides: RaceOverrides): void {
    write(KEYS.overrides, overrides)
  },
  clearAll(): void {
    try {
      localStorage.removeItem(KEYS.activities)
      localStorage.removeItem(KEYS.meta)
      localStorage.removeItem(KEYS.overrides)
      localStorage.removeItem(LEGACY_KEYS.activities)
      localStorage.removeItem(LEGACY_KEYS.meta)
      localStorage.removeItem(LEGACY_KEYS.overrides)
    } catch {
      // ignore
    }
  },
  loadTheme(): 'light' | 'dark' | null {
    try {
      const t = localStorage.getItem(KEYS.theme) ?? localStorage.getItem(LEGACY_KEYS.theme)
      return t === 'light' || t === 'dark' ? t : null
    } catch {
      return null
    }
  },
  saveTheme(theme: 'light' | 'dark'): void {
    try {
      localStorage.setItem(KEYS.theme, theme)
    } catch {
      // ignore
    }
  },
}
