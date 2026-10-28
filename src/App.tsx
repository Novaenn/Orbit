import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivitiesTab } from './components/activities/ActivitiesTab'
import { ActivityDetail } from './components/activities/ActivityDetail'
import { AppShell } from './components/AppShell'
import { ClearDataDialog, DataDetailsDialog } from './components/DataDialogs'
import { InsightsTab } from './components/insights/InsightsTab'
import { OverviewTab } from './components/overview/OverviewTab'
import { RacesTab } from './components/races/RacesTab'
import { TABS } from './components/tabs'
import { UploadScreen } from './components/UploadScreen'
import { useActivities, type ActivitiesState } from './hooks/useActivities'
import { useNavigation } from './hooks/useNavigation'
import { useTheme } from './hooks/useTheme'
import { fitnessSeries } from './lib/fitness'
import { personalBests } from './lib/pbs'
import { DEFAULT_WINDOW_WEEKS, predictRaces } from './lib/predict'
import { resolveRange } from './lib/range'
import { buildSummary } from './lib/summary'
import type { Activity, RangePreset } from './lib/types'
import { SnackbarProvider } from './md/Snackbar'
import { useSnackbar } from './md/snackbarContext'

export default function App() {
  return (
    <SnackbarProvider>
      <Root />
    </SnackbarProvider>
  )
}

function shortName(name: string): string {
  return name.length > 32 ? `${name.slice(0, 31)}…` : name
}

function Root() {
  const data = useActivities()
  const { dark, toggle } = useTheme()
  const showSnackbar = useSnackbar()
  const inputRef = useRef<HTMLInputElement>(null)
  const pickFile = useCallback(() => inputRef.current?.click(), [])

  const { importFile } = data
  const handleFile = useCallback(
    async (file: File) => {
      const count = await importFile(file)
      if (count !== null) showSnackbar({ message: `Loaded ${count} activities from ${file.name}` })
    },
    [importFile, showSnackbar],
  )

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept=".csv,text/csv"
      hidden
      onChange={(e) => {
        const file = e.target.files?.[0]
        if (file) handleFile(file)
        e.target.value = ''
      }}
    />
  )

  if (!data.activities || !data.meta) {
    return (
      <>
        <UploadScreen
          onPickFile={pickFile}
          onFile={handleFile}
          loading={data.loading}
          error={data.error}
          onDismissError={data.clearError}
          dark={dark}
          onToggleTheme={toggle}
        />
        {fileInput}
      </>
    )
  }

  return (
    <>
      <Dashboard
        key={data.meta.importedAt}
        activities={data.activities}
        data={data}
        dark={dark}
        onToggleTheme={toggle}
        onPickFile={pickFile}
      />
      {fileInput}
    </>
  )
}

function Dashboard({
  activities,
  data,
  dark,
  onToggleTheme,
  onPickFile,
}: {
  activities: Activity[]
  data: ActivitiesState
  dark: boolean
  onToggleTheme: () => void
  onPickFile: () => void
}) {
  const showSnackbar = useSnackbar()
  const { tab, detailId, navigate, openDetail, closeDetail, clearDetail } = useNavigation(TABS, 'overview')
  const [preset, setPreset] = useState<RangePreset>('12w')
  const [windowWeeks, setWindowWeeks] = useState(DEFAULT_WINDOW_WEEKS)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [clearOpen, setClearOpen] = useState(false)
  const [reimportDismissed, setReimportDismissed] = useState(false)
  const [today] = useState(() => new Date())

  const range = useMemo(() => resolveRange(preset, activities, today), [preset, activities, today])
  const summary = useMemo(() => buildSummary(activities, today), [activities, today])
  const fitness = useMemo(() => fitnessSeries(activities, range.end), [activities, range.end])
  const races = useMemo(() => activities.filter((a) => data.raceIds.has(a.id)), [activities, data.raceIds])
  const pbs = useMemo(() => personalBests(races), [races])
  const prediction = useMemo(
    () => predictRaces(activities, races, { windowWeeks }),
    [activities, races, windowWeeks],
  )

  const detailActivity = detailId ? (activities.find((a) => a.id === detailId) ?? null) : null
  // A link or reload can point at an activity that isn't in this file.
  useEffect(() => {
    if (detailId && !detailActivity) clearDetail()
  }, [detailId, detailActivity, clearDetail])

  const { raceIds, toggleRace } = data
  const onToggleRace = useCallback(
    (activity: Activity) => {
      const wasRace = raceIds.has(activity.id)
      toggleRace(activity)
      showSnackbar({
        message: wasRace
          ? `“${shortName(activity.name)}” removed from races`
          : `“${shortName(activity.name)}” marked as a race`,
        action: { label: 'Undo', onAction: () => toggleRace(activity) },
      })
    },
    [raceIds, toggleRace, showSnackbar],
  )

  return (
    <AppShell
      tab={tab}
      onNavigate={navigate}
      meta={data.meta!}
      dark={dark}
      onToggleTheme={onToggleTheme}
      onUpload={onPickFile}
      onShowDataDetails={() => setDetailsOpen(true)}
      onClearData={() => setClearOpen(true)}
      loading={data.loading}
      error={data.error}
      onDismissError={data.clearError}
      needsReimport={data.needsReimport && !reimportDismissed}
      onDismissReimport={() => setReimportDismissed(true)}
    >
      {tab === 'overview' && (
        <OverviewTab
          activities={activities}
          summary={summary}
          fitness={fitness}
          range={range}
          preset={preset}
          onPresetChange={setPreset}
          today={today}
          dark={dark}
          onOpenActivity={openDetail}
        />
      )}
      {tab === 'races' && (
        <RacesTab
          races={races}
          overrides={data.overrides}
          prediction={prediction}
          windowWeeks={windowWeeks}
          onWindowChange={setWindowWeeks}
          pbs={pbs}
          onToggleRace={onToggleRace}
          onGoToActivities={() => navigate('activities')}
          onOpenActivity={openDetail}
        />
      )}
      {tab === 'insights' && (
        <InsightsTab
          activities={activities}
          races={races}
          raceIds={data.raceIds}
          range={range}
          preset={preset}
          onPresetChange={setPreset}
          today={today}
          dark={dark}
        />
      )}
      {tab === 'activities' && (
        <ActivitiesTab
          activities={activities}
          raceIds={data.raceIds}
          onToggleRace={onToggleRace}
          onOpenActivity={openDetail}
        />
      )}

      <ActivityDetail
        activity={detailActivity}
        isRace={detailActivity ? raceIds.has(detailActivity.id) : false}
        onToggleRace={onToggleRace}
        onClose={closeDetail}
      />

      <DataDetailsDialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        onUpload={onPickFile}
        meta={data.meta!}
        activities={activities}
        overrides={data.overrides}
      />
      <ClearDataDialog
        open={clearOpen}
        onClose={() => setClearOpen(false)}
        onConfirm={() => {
          data.clear()
          showSnackbar({ message: 'Imported data cleared' })
        }}
      />
    </AppShell>
  )
}
