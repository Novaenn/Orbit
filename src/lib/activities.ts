import type { Activity } from './types'

export const RUN_TYPES = new Set(['Run', 'VirtualRun', 'TrailRun'])

export function isRun(a: Activity): boolean {
  return RUN_TYPES.has(a.type)
}
