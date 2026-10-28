import type { PersonalBest } from '../../lib/pbs'
import type { PredictionResult } from '../../lib/predict'
import type { Activity, RaceOverrides } from '../../lib/types'
import { PersonalBests } from './PersonalBests'
import { RaceHistory } from './RaceHistory'
import { RacePrediction } from './RacePrediction'

export function RacesTab({
  races,
  overrides,
  prediction,
  windowWeeks,
  onWindowChange,
  pbs,
  onToggleRace,
  onGoToActivities,
  onOpenActivity,
}: {
  races: Activity[]
  overrides: RaceOverrides
  prediction: PredictionResult
  windowWeeks: number
  onWindowChange: (weeks: number) => void
  pbs: PersonalBest[]
  onToggleRace: (a: Activity) => void
  onGoToActivities: () => void
  onOpenActivity: (id: string) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:gap-8">
      <RacePrediction
        result={prediction}
        windowWeeks={windowWeeks}
        onWindowChange={onWindowChange}
        pbs={pbs}
        onGoToActivities={onGoToActivities}
      />
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        <PersonalBests pbs={pbs} />
        <RaceHistory
          races={races}
          overrides={overrides}
          onToggleRace={onToggleRace}
          onOpenActivity={onOpenActivity}
        />
      </div>
    </div>
  )
}
