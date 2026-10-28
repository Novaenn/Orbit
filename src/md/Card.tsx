import type { ReactNode } from 'react'
import { cx } from './cx'

/** Material card: 4dp corners, 1dp resting elevation. */
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cx('rounded bg-surface-1 shadow-e1', className)}>{children}</section>
}

export function CardHeader({
  title,
  subtitle,
  overline,
  action,
  className,
}: {
  title: ReactNode
  subtitle?: ReactNode
  overline?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cx('flex items-start gap-2 px-4 pt-3 pb-2', className)}>
      <div className="min-w-0 flex-1 pt-1">
        {overline && <div className="type-overline text-on-surface/60">{overline}</div>}
        <h2 className="type-h6 text-on-surface/87">{title}</h2>
        {subtitle && <p className="type-body2 text-on-surface/60">{subtitle}</p>}
      </div>
      {action && <div className="-mr-2 flex shrink-0 items-center">{action}</div>}
    </div>
  )
}

export function CardActions({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('flex items-center gap-2 p-2', className)}>{children}</div>
}

export function Divider({ className, inset }: { className?: string; inset?: boolean }) {
  return <hr className={cx('border-0 border-t border-on-surface/12', inset && 'ml-[72px]', className)} />
}
