import { expect, test, type Page } from '@playwright/test'
import { fileURLToPath } from 'node:url'

const CSV = fileURLToPath(new URL('../i463508_activities.csv', import.meta.url))

async function loadApp(page: Page) {
  await page.goto('/')
  await page.locator('input[type=file]').setInputFiles(CSV)
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible()
  await page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: 'Insights' }).click()
  await expect(page.getByRole('heading', { name: 'Training insights' })).toBeVisible()
}

function card(page: Page, title: string) {
  return page.getByRole('heading', { name: title }).locator('xpath=ancestor::section[1]')
}

test('shows the four insight cards', async ({ page }) => {
  await loadApp(page)

  await expect(page.getByRole('heading', { name: 'Fitness progression' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Heart-rate zones' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Cadence' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Training patterns' })).toBeVisible()
})

test('switches each card between its views', async ({ page }) => {
  await loadApp(page)

  await page.getByRole('radiogroup', { name: 'Time range' }).getByRole('radio', { name: '1 year' }).click()

  const progression = card(page, 'Fitness progression')
  const progressionReadout = progression.locator('[aria-live="polite"]')
  await expect(progressionReadout.getByText('12%')).toBeVisible()

  await progression.getByRole('radio', { name: 'VDOT' }).click()
  await expect(progressionReadout.getByText('36.9')).toBeVisible()
  await expect(progressionReadout.getByText('44.3')).toBeVisible()

  await progression.getByRole('radio', { name: 'Pace' }).click()
  await expect(progressionReadout.getByText('4:50').first()).toBeVisible()
  await expect(progressionReadout.getByText('5:30').first()).toBeVisible()

  const zones = card(page, 'Heart-rate zones')
  await zones.getByRole('radio', { name: '%' }).click()
  await expect(zones.getByRole('radio', { name: '%' })).toHaveAttribute('aria-checked', 'true')
  await expect(zones.locator('[aria-live="polite"]').getByText('59%')).toBeVisible()

  const patterns = card(page, 'Training patterns')
  await patterns.getByRole('radio', { name: 'Time of day' }).click()
  await expect(patterns.locator('[aria-live="polite"]').getByText('18 · 28')).toBeVisible()
  await patterns.getByRole('radio', { name: 'Weekday' }).click()
  await expect(patterns.locator('[aria-live="polite"]').getByText('Mon · 23')).toBeVisible()
})

test('shows a hovered week in the zone readout', async ({ page }) => {
  await loadApp(page)

  await page.getByRole('radiogroup', { name: 'Time range' }).getByRole('radio', { name: '1 year' }).click()

  const zones = card(page, 'Heart-rate zones')
  const readout = zones.locator('[aria-live="polite"]')
  await expect(readout.locator('.type-overline')).toHaveText('Last year')

  const chart = zones.locator('.recharts-wrapper')
  await chart.hover({ position: { x: 240, y: 120 } })

  await expect(readout.locator('.type-overline')).toContainText('Week of')
})
