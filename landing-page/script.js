const menuToggle = document.querySelector('.menu-toggle')
const mobileNav = document.querySelector('#mobile-nav')

// Update only an existing registration at the former app scope. A worker on
// the personal website, or the new /app/ worker, must remain untouched.
if ('serviceWorker' in navigator) {
  const landingScope = new URL('./', location.href).href
  navigator.serviceWorker.getRegistration(landingScope).then(registration => {
    if (registration?.scope === landingScope) return registration.update()
  }).catch(() => {})
}

function closeMenu() {
  mobileNav.hidden = true
  menuToggle.setAttribute('aria-expanded', 'false')
  menuToggle.setAttribute('aria-label', 'Open navigation')
}

menuToggle.addEventListener('click', () => {
  const opening = menuToggle.getAttribute('aria-expanded') !== 'true'
  mobileNav.hidden = !opening
  menuToggle.setAttribute('aria-expanded', String(opening))
  menuToggle.setAttribute('aria-label', opening ? 'Close navigation' : 'Open navigation')
})

mobileNav.addEventListener('click', (event) => {
  if (event.target.closest('a')) closeMenu()
})

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
    closeMenu()
    menuToggle.focus()
  }
})

window.matchMedia('(min-width: 601px)').addEventListener('change', (event) => {
  if (event.matches) closeMenu()
})

const previewLink = document.querySelector('.expand-preview')
const screenshotDialog = document.querySelector('.screenshot-dialog')
const closeDialog = document.querySelector('.dialog-close')

previewLink.addEventListener('click', (event) => {
  if (typeof screenshotDialog.showModal !== 'function') return
  event.preventDefault()
  screenshotDialog.showModal()
  screenshotDialog.scrollTop = 0
})

closeDialog.addEventListener('click', () => screenshotDialog.close())
screenshotDialog.addEventListener('click', (event) => {
  if (event.target !== screenshotDialog) return
  const bounds = screenshotDialog.getBoundingClientRect()
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) screenshotDialog.close()
})
