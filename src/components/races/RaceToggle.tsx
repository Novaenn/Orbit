import { mdiFlag, mdiFlagOutline } from '@mdi/js'
import { IconButton } from '../../md/Button'
import { cx } from '../../md/cx'

/** Icon toggle button: marks a run as a race (filled flag in the secondary colour). */
export function RaceToggle({ isRace, onToggle, name }: { isRace: boolean; onToggle: () => void; name: string }) {
  return (
    <IconButton
      icon={isRace ? mdiFlag : mdiFlagOutline}
      label={isRace ? `Unmark “${name}” as a race` : `Mark “${name}” as a race`}
      aria-pressed={isRace}
      tooltip={false}
      onClick={onToggle}
      className={cx(isRace ? 'text-secondary' : 'text-on-surface/60')}
    />
  )
}
