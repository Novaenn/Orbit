import { mdiMedalOutline } from '@mdi/js'
import { format } from 'date-fns'
import { parseLocal } from '../../lib/dates'
import { formatDuration, formatPace } from '../../lib/format'
import type { PersonalBest } from '../../lib/pbs'
import { Card, CardHeader } from '../../md/Card'
import { ListAvatar, ListItem } from '../../md/List'

export function PersonalBests({ pbs }: { pbs: PersonalBest[] }) {
  return (
    <Card>
      <CardHeader title="Personal bests" subtitle="Races only · within ±3% of the distance" />
      <ul className="grid grid-cols-1 pb-2 sm:grid-cols-2">
        {pbs.map((pb) => (
          <ListItem
            key={pb.distance.key}
            leading={<ListAvatar icon={mdiMedalOutline} tone={pb.race ? 'secondary' : 'primary'} />}
            primary={pb.distance.label}
            secondary={
              pb.race
                ? `${pb.race.name} · ${format(parseLocal(pb.race.date), 'd MMM yyyy')}`
                : 'No race at this distance yet'
            }
            trailing={
              pb.race && pb.seconds ? (
                <div className="text-right">
                  <div className="type-h6 tabular-nums text-on-surface/87">{formatDuration(pb.seconds)}</div>
                  <div className="type-caption tabular-nums text-on-surface/60">
                    {formatPace(pb.seconds / (pb.race.distanceM / 1000))} /km
                  </div>
                </div>
              ) : (
                <span className="type-h6 text-on-surface/38">–</span>
              )
            }
          />
        ))}
      </ul>
    </Card>
  )
}
