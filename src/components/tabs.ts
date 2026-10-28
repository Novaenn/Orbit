export const TABS = ['overview', 'races', 'insights', 'activities'] as const
export type Tab = (typeof TABS)[number]
