import { mdiAlertCircleOutline, mdiCloudUploadOutline, mdiTrayArrowUp } from '@mdi/js'
import { useState, type DragEvent } from 'react'
import { Banner } from '../md/Banner'
import { Button } from '../md/Button'
import { cx } from '../md/cx'
import { Icon } from '../md/Icon'
import { TopAppBar } from './AppShell'

/** First run: explains what to load and offers a single, clear action. */
export function UploadScreen({
  onPickFile,
  onFile,
  loading,
  error,
  onDismissError,
  dark,
  onToggleTheme,
}: {
  onPickFile: () => void
  onFile: (file: File) => void
  loading: boolean
  error: string | null
  onDismissError: () => void
  dark: boolean
  onToggleTheme: () => void
}) {
  const [dragging, setDragging] = useState(false)

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <TopAppBar title="Orbit" dark={dark} onToggleTheme={onToggleTheme} loading={loading} />
      {error && (
        <Banner
          tone="error"
          icon={mdiAlertCircleOutline}
          actions={
            <>
              <Button onClick={onDismissError}>Dismiss</Button>
              <Button onClick={onPickFile}>Try again</Button>
            </>
          }
        >
          {error}
        </Banner>
      )}

      <main
        className="flex flex-1 items-center justify-center px-4 py-8 sm:px-8"
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <div
          className={cx(
            'flex w-full max-w-[560px] flex-col items-center rounded px-6 py-10 text-center transition-colors sm:px-12 sm:py-14',
            dragging && 'bg-primary/8 ring-2 ring-primary ring-inset',
          )}
        >
          <span className="flex size-24 items-center justify-center rounded-full bg-primary/12 text-primary">
            <Icon path={mdiCloudUploadOutline} size={48} />
          </span>
          <h2 className="type-h5 mt-6 text-on-surface/87">Welcome to Orbit</h2>
          <p className="type-body1 mt-2 text-on-surface/60">
            Choose the activities CSV exported from intervals.icu to see your weekly volume, fitness, races,
            insights and predictions.
            <span className="hidden md:inline"> You can also drop the file here.</span>
          </p>
          <Button variant="contained" icon={mdiTrayArrowUp} className="mt-8" onClick={onPickFile} disabled={loading}>
            Choose CSV file
          </Button>
          <p className="type-caption mt-4 text-on-surface/60">The file is read on this device and never uploaded.</p>
        </div>
      </main>
    </div>
  )
}
