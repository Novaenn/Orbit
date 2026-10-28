import {
  mdiAlertCircleOutline,
  mdiBrightness4,
  mdiBrightness7,
  mdiChartBox,
  mdiChartBoxOutline,
  mdiDatabaseOutline,
  mdiDeleteOutline,
  mdiDotsVertical,
  mdiFormatListBulleted,
  mdiTrayArrowUp,
  mdiTrophy,
  mdiTrophyOutline,
  mdiViewDashboard,
  mdiViewDashboardOutline,
} from '@mdi/js'
import { useState, type ReactNode } from 'react'
import { Banner } from '../md/Banner'
import { Button, IconButton } from '../md/Button'
import { cx } from '../md/cx'
import { Icon } from '../md/Icon'
import { useWindowClass } from '../md/layout'
import { LinearProgress } from '../md/LinearProgress'
import { Menu } from '../md/Menu'
import type { DataMeta } from '../lib/types'
import { AppLogo } from './AppLogo'
import { TABS, type Tab } from './tabs'

const DESTINATIONS: Record<Tab, { label: string; icon: string; activeIcon: string }> = {
  overview: { label: 'Overview', icon: mdiViewDashboardOutline, activeIcon: mdiViewDashboard },
  races: { label: 'Races', icon: mdiTrophyOutline, activeIcon: mdiTrophy },
  insights: { label: 'Insights', icon: mdiChartBoxOutline, activeIcon: mdiChartBox },
  activities: { label: 'Activities', icon: mdiFormatListBulleted, activeIcon: mdiFormatListBulleted },
}

export function AppShell({
  tab,
  onNavigate,
  meta,
  dark,
  onToggleTheme,
  onUpload,
  onShowDataDetails,
  onClearData,
  loading,
  error,
  onDismissError,
  needsReimport,
  onDismissReimport,
  children,
}: {
  tab: Tab
  onNavigate: (tab: Tab) => void
  meta: DataMeta
  dark: boolean
  onToggleTheme: () => void
  onUpload: () => void
  onShowDataDetails: () => void
  onClearData: () => void
  loading: boolean
  error: string | null
  onDismissError: () => void
  needsReimport?: boolean
  onDismissReimport?: () => void
  children: ReactNode
}) {
  const windowClass = useWindowClass()

  return (
    <div className="min-h-dvh">
      {windowClass === 'medium' && <NavigationRail tab={tab} onNavigate={onNavigate} />}
      {windowClass === 'expanded' && <NavigationDrawer tab={tab} onNavigate={onNavigate} meta={meta} />}

      <div className={cx(windowClass === 'medium' && 'pl-[72px]', windowClass === 'expanded' && 'pl-64')}>
        <TopAppBar
          title={DESTINATIONS[tab].label}
          dark={dark}
          onToggleTheme={onToggleTheme}
          onUpload={onUpload}
          onShowDataDetails={onShowDataDetails}
          onClearData={onClearData}
          loading={loading}
        />
        {error && (
          <Banner
            tone="error"
            icon={mdiAlertCircleOutline}
            actions={
              <>
                <Button onClick={onDismissError}>Dismiss</Button>
                <Button onClick={onUpload}>Try again</Button>
              </>
            }
          >
            Couldn't load that file. {error} Your previous data is still shown.
          </Banner>
        )}
        {!error && needsReimport && (
          <Banner
            icon={mdiDatabaseOutline}
            actions={
              <>
                {onDismissReimport && <Button onClick={onDismissReimport}>Not now</Button>}
                <Button onClick={onUpload}>Upload CSV</Button>
              </>
            }
          >
            Upload your CSV again to see heart-rate zones, cadence, calories, shoes and threshold pace. Your saved
            data was imported before these were read.
          </Banner>
        )}
        <main className="mx-auto w-full max-w-[904px] px-4 pt-4 pb-[calc(72px+env(safe-area-inset-bottom))] sm:px-8 sm:pt-6 sm:pb-8 lg:max-w-[1104px]">
          <div key={tab} className="md-fade-through">
            {children}
          </div>
        </main>
      </div>

      {windowClass === 'compact' && <BottomNavigation tab={tab} onNavigate={onNavigate} />}
    </div>
  )
}

export function TopAppBar({
  title,
  dark,
  onToggleTheme,
  onUpload,
  onShowDataDetails,
  onClearData,
  loading,
}: {
  title: string
  dark: boolean
  onToggleTheme: () => void
  onUpload?: () => void
  onShowDataDetails?: () => void
  onClearData?: () => void
  loading: boolean
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 bg-app-bar pt-[env(safe-area-inset-top)] text-on-app-bar shadow-e4">
      <div className="flex h-14 items-center gap-1 pr-1 pl-4 sm:h-16 sm:pr-2 sm:pl-6">
        <h1 className="type-h6 min-w-0 flex-1 truncate">{title}</h1>
        {onUpload && <IconButton icon={mdiTrayArrowUp} label="Upload new CSV" onClick={onUpload} />}
        <IconButton
          icon={dark ? mdiBrightness7 : mdiBrightness4}
          label={dark ? 'Light theme' : 'Dark theme'}
          onClick={onToggleTheme}
          tooltipAlign={onShowDataDetails ? 'center' : 'end'}
        />
        {onShowDataDetails && onClearData && (
          <Menu
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            label="More options"
            items={[
              { label: 'Data details', icon: mdiDatabaseOutline, onSelect: onShowDataDetails },
              { label: 'Clear data', icon: mdiDeleteOutline, onSelect: onClearData },
            ]}
            trigger={
              <IconButton
                icon={mdiDotsVertical}
                label="More options"
                tooltipAlign="end"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((o) => !o)}
              />
            }
          />
        )}
      </div>
      {loading && (
        <div className="absolute inset-x-0 bottom-0">
          <LinearProgress label="Reading file" />
        </div>
      )}
    </header>
  )
}

/** Bottom navigation (phones): 56dp, 3 destinations with icon and label. */
function BottomNavigation({ tab, onNavigate }: { tab: Tab; onNavigate: (tab: Tab) => void }) {
  return (
    <nav
      data-nav="bottom"
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 bg-surface-8 pb-[env(safe-area-inset-bottom)] shadow-e8"
    >
      <ul className="flex h-14 justify-center">
        {TABS.map((t) => {
          const active = t === tab
          const d = DESTINATIONS[t]
          return (
            <li key={t} className="max-w-[168px] min-w-20 flex-1">
              <button
                type="button"
                data-ripple
                aria-current={active ? 'page' : undefined}
                onClick={() => onNavigate(t)}
                className={cx(
                  'state-layer flex h-14 w-full flex-col items-center justify-center pt-1.5 pb-2 transition-colors',
                  active ? 'text-primary' : 'text-on-surface/60',
                )}
              >
                <Icon path={active ? d.activeIcon : d.icon} />
                <span
                  className={cx(
                    'leading-4 tracking-[0.03em] transition-[font-size] duration-150',
                    active ? 'text-sm' : 'text-xs',
                  )}
                >
                  {d.label}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/** Navigation rail (tablets): 72dp wide, fixed to the leading edge. */
function NavigationRail({ tab, onNavigate }: { tab: Tab; onNavigate: (tab: Tab) => void }) {
  return (
    <nav
      data-nav="rail"
      aria-label="Main"
      className="fixed inset-y-0 left-0 z-20 flex w-[72px] flex-col items-center border-r border-on-surface/12 bg-surface pt-[env(safe-area-inset-top)]"
    >
      <div className="flex h-16 items-center" aria-hidden="true">
        <AppLogo />
      </div>
      <ul className="mt-2 flex flex-col">
        {TABS.map((t) => {
          const active = t === tab
          const d = DESTINATIONS[t]
          return (
            <li key={t}>
              <button
                type="button"
                data-ripple
                aria-current={active ? 'page' : undefined}
                onClick={() => onNavigate(t)}
                className={cx(
                  'state-layer type-caption flex size-[72px] flex-col items-center justify-center gap-1 transition-colors',
                  active ? 'text-primary' : 'text-on-surface/60',
                )}
              >
                <Icon path={active ? d.activeIcon : d.icon} />
                {d.label}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/** Permanent navigation drawer (desktop): 256dp, at the same elevation as the content. */
function NavigationDrawer({ tab, onNavigate, meta }: { tab: Tab; onNavigate: (tab: Tab) => void; meta: DataMeta }) {
  return (
    <nav
      data-nav="drawer"
      aria-label="Main"
      className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-on-surface/12 bg-surface"
    >
      <div className="flex h-16 items-center gap-3 px-4">
        <AppLogo />
        <div className="min-w-0">
          <div className="type-subtitle2 text-on-surface/87">Orbit</div>
          <div className="type-caption truncate text-on-surface/60" title={meta.fileName}>
            {meta.fileName}
          </div>
        </div>
      </div>
      <hr className="border-0 border-t border-on-surface/12" />
      <ul className="flex flex-col gap-1 p-2">
        {TABS.map((t) => {
          const active = t === tab
          const d = DESTINATIONS[t]
          return (
            <li key={t}>
              <button
                type="button"
                data-ripple
                aria-current={active ? 'page' : undefined}
                onClick={() => onNavigate(t)}
                className={cx(
                  'state-layer type-subtitle2 flex h-12 w-full items-center gap-8 rounded px-2 text-left transition-colors',
                  active ? 'bg-primary/12 text-primary' : 'text-on-surface/87',
                )}
              >
                <Icon path={active ? d.activeIcon : d.icon} className={active ? undefined : 'text-on-surface/60'} />
                {d.label}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
