/**
 * Material ripple for every element marked with `data-ripple`.
 * `data-ripple="center"` starts the ripple from the centre (icon buttons).
 * The host needs the `state-layer` utility (position + overflow).
 */
export function installRipple(): void {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

  document.addEventListener(
    'pointerdown',
    (event) => {
      if (event.button !== 0 || reduceMotion.matches) return
      const host = (event.target as Element | null)?.closest<HTMLElement>('[data-ripple]')
      if (!host || host.matches(':disabled') || host.getAttribute('aria-disabled') === 'true') return

      const rect = host.getBoundingClientRect()
      const centered = host.dataset.ripple === 'center'
      const x = centered ? rect.width / 2 : event.clientX - rect.left
      const y = centered ? rect.height / 2 : event.clientY - rect.top
      const radius = centered
        ? Math.hypot(rect.width, rect.height) / 2
        : Math.hypot(Math.max(x, rect.width - x), Math.max(y, rect.height - y))

      const ripple = document.createElement('span')
      ripple.className = 'md-ripple'
      ripple.style.width = ripple.style.height = `${radius * 2}px`
      ripple.style.left = `${x - radius}px`
      ripple.style.top = `${y - radius}px`
      host.appendChild(ripple)

      const startedAt = performance.now()
      const release = () => {
        window.removeEventListener('pointerup', release)
        window.removeEventListener('pointercancel', release)
        // Let the ripple finish expanding before it fades out.
        const remaining = Math.max(0, 225 - (performance.now() - startedAt))
        window.setTimeout(() => {
          ripple.classList.add('is-out')
          window.setTimeout(() => ripple.remove(), 200)
        }, remaining)
      }
      window.addEventListener('pointerup', release)
      window.addEventListener('pointercancel', release)
    },
    { passive: true },
  )
}
