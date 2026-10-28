import { cx } from './cx'

/** Material icon from an @mdi/js path, 24dp by default. */
export function Icon({ path, size = 24, className }: { path: string; size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
      className={cx('shrink-0', className)}
    >
      <path d={path} />
    </svg>
  )
}
