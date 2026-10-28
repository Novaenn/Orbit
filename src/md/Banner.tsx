import type { ReactNode } from 'react'
import { cx } from './cx'
import { Icon } from './Icon'

/**
 * Material banner: a prominent, non-modal message with up to two actions.
 * Stays until dismissed or until the problem is resolved.
 */
export function Banner({
  icon,
  children,
  actions,
  tone = 'primary',
}: {
  icon: string
  children: ReactNode
  actions: ReactNode
  tone?: 'primary' | 'error'
}) {
  return (
    <div role="alert" className="bg-surface md-enter-fade">
      <div className="mx-auto flex max-w-[1040px] flex-wrap items-center gap-x-4 gap-y-1 px-4 pt-4 pb-2 sm:px-8">
        <span
          className={cx(
            'flex size-10 shrink-0 items-center justify-center rounded-full',
            tone === 'error' ? 'bg-error text-on-error' : 'bg-primary text-on-primary',
          )}
        >
          <Icon path={icon} />
        </span>
        <p className="type-body2 min-w-0 flex-1 basis-60 text-on-surface/87">{children}</p>
        <div className="-mr-2 ml-auto flex gap-2">{actions}</div>
      </div>
      <hr className="border-0 border-t border-on-surface/12" />
    </div>
  )
}
