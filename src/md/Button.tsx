import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react'
import { cx } from './cx'
import { Icon } from './Icon'

type ButtonVariant = 'text' | 'outlined' | 'contained'

type ButtonTone = 'primary' | 'error'

const VARIANTS: Record<ButtonVariant, string> = {
  text: 'px-2 disabled:text-on-surface/38',
  outlined: 'border border-on-surface/12 px-[15px] disabled:text-on-surface/38',
  contained:
    'px-4 shadow-e2 transition-shadow duration-200 ease-standard hover:shadow-e4 active:shadow-e8 disabled:bg-on-surface/12 disabled:text-on-surface/38 disabled:shadow-none',
}

const TONES: Record<ButtonTone, { content: string; container: string }> = {
  primary: { content: 'text-primary', container: 'bg-primary text-on-primary' },
  error: { content: 'text-error', container: 'bg-error text-on-error' },
}

/** Material button: text (low emphasis), outlined (medium) or contained (high). */
export function Button({
  variant = 'text',
  tone = 'primary',
  icon,
  className,
  children,
  ref,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  tone?: ButtonTone
  icon?: string
  ref?: Ref<HTMLButtonElement>
}) {
  return (
    <button
      ref={ref}
      type="button"
      data-ripple
      className={cx(
        'state-layer type-button inline-flex h-9 min-w-16 shrink-0 items-center justify-center gap-2 rounded whitespace-nowrap select-none',
        VARIANTS[variant],
        variant === 'contained' ? TONES[tone].container : TONES[tone].content,
        icon && variant !== 'text' && 'pl-3',
        className,
      )}
      {...rest}
    >
      {icon && <Icon path={icon} size={18} />}
      {children}
    </button>
  )
}

/** 48dp icon button with a tooltip. */
export function IconButton({
  icon,
  label,
  tooltip = true,
  tooltipAlign = 'center',
  className,
  ref,
  ...rest
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  icon: string
  label: string
  tooltip?: boolean
  tooltipAlign?: 'center' | 'end' | 'start'
  ref?: Ref<HTMLButtonElement>
}) {
  const button = (
    <button
      ref={ref}
      type="button"
      data-ripple="center"
      aria-label={label}
      title={tooltip ? undefined : label}
      className={cx(
        'state-layer inline-flex size-12 shrink-0 items-center justify-center rounded-full disabled:opacity-38',
        className,
      )}
      {...rest}
    >
      <Icon path={icon} />
    </button>
  )
  return tooltip ? (
    <Tooltip label={label} align={tooltipAlign}>
      {button}
    </Tooltip>
  ) : (
    button
  )
}

/** Material tooltip: shown on hover (pointer devices) and keyboard focus. */
export function Tooltip({
  label,
  align = 'center',
  children,
}: {
  label: string
  align?: 'center' | 'end' | 'start'
  children: ReactNode
}) {
  return (
    <span className="group/tooltip relative inline-flex">
      {children}
      <span
        role="presentation"
        className={cx(
          // display:none while hidden so an invisible tooltip never widens the page.
          'type-caption pointer-events-none absolute top-full z-50 mt-1 hidden rounded bg-tooltip px-2 leading-6 whitespace-nowrap text-white',
          'transition-[opacity,display] duration-150 transition-discrete starting:opacity-0',
          'group-hover/tooltip:block group-hover/tooltip:delay-500 group-has-[:focus-visible]/tooltip:block',
          align === 'center' && 'left-1/2 -translate-x-1/2',
          align === 'end' && 'right-0',
          align === 'start' && 'left-0',
        )}
      >
        {label}
      </span>
    </span>
  )
}
