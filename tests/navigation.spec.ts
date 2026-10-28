import { expect, test } from '@playwright/test'
import { fileURLToPath } from 'node:url'

const CSV = fileURLToPath(new URL('../mock-activities.csv', import.meta.url))

test.use({ viewport: { width: 390, height: 844 } })

test('keeps the app bar and bottom navigation above the page transition', async ({ page }) => {
  await page.goto('/')
  await page.locator('input[type=file]').setInputFiles(CSV)
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible()

  const state = await page.evaluate(async () => {
    const button = [...document.querySelectorAll<HTMLButtonElement>('[data-nav="bottom"] button')].find(
      (b) => b.textContent?.trim() === 'Insights',
    )
    if (!button) throw new Error('Insights button not found')
    button.click()

    const pseudoOf = (animation: Animation) =>
      (animation.effect as KeyframeEffect | null)?.pseudoElement ?? ''
    const hasContentAnimation = () =>
      document.getAnimations().some((a) => pseudoOf(a) === '::view-transition-new(md-content)')

    // Wait until the view transition has captured both pages, then freeze it.
    const deadline = performance.now() + 2000
    while (!hasContentAnimation()) {
      if (performance.now() > deadline) throw new Error('View transition did not start')
      await new Promise((resolve) => requestAnimationFrame(resolve))
    }
    for (const animation of document.getAnimations()) animation.pause()

    const transitionName = (selector: string) => {
      const element = document.querySelector(selector)
      return element ? getComputedStyle(element).viewTransitionName : null
    }
    const animationName = (pseudo: string) =>
      getComputedStyle(document.documentElement, pseudo).animationName
    const snapshotAnimations = (name: string) =>
      document
        .getAnimations()
        .map(pseudoOf)
        .filter(
          (pseudo) =>
            pseudo === `::view-transition-old(${name})` || pseudo === `::view-transition-new(${name})`,
        )

    return {
      contentOld: animationName('::view-transition-old(md-content)'),
      contentNew: animationName('::view-transition-new(md-content)'),
      appBarName: transitionName('[data-app-bar]'),
      navName: transitionName('[data-nav="bottom"]'),
      appBarOld: animationName('::view-transition-old(md-app-bar)'),
      appBarNew: animationName('::view-transition-new(md-app-bar)'),
      navOld: animationName('::view-transition-old(md-nav)'),
      navNew: animationName('::view-transition-new(md-nav)'),
      appBarAnimations: snapshotAnimations('md-app-bar'),
      navAnimations: snapshotAnimations('md-nav'),
    }
  })

  // The page content still fades through.
  expect(state.contentOld).toBe('md-fade-out')
  expect(state.contentNew).toBe('md-fade-through-in')

  // The persistent bars participate in the transition but never fade with the page.
  expect(state.appBarName).toBe('md-app-bar')
  expect(state.navName).toBe('md-nav')
  expect(state.appBarOld).toBe('none')
  expect(state.appBarNew).toBe('none')
  expect(state.navOld).toBe('none')
  expect(state.navNew).toBe('none')
  expect(state.appBarAnimations).toEqual([])
  expect(state.navAnimations).toEqual([])
})
