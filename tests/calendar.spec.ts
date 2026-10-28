import { expect, test, type Page } from '@playwright/test'
import { fileURLToPath } from 'node:url'

const CSV = fileURLToPath(new URL('../i463508_activities.csv', import.meta.url))

async function loadApp(page: Page) {
  await page.goto('/')
  await page.locator('input[type=file]').setInputFiles(CSV)
  await expect(page.getByRole('heading', { name: 'Running calendar' })).toBeVisible()
}

function calendar(page: Page) {
  return page.getByRole('heading', { name: 'Running calendar' }).locator('xpath=ancestor::section[1]')
}

test('opens a single-run day from the middle of the heatmap', async ({ page }) => {
  await loadApp(page)

  const readout = calendar(page).locator('[aria-live="polite"]')
  const day = page.getByRole('button', { name: 'Open run on 22 Jul 2026: 5.0 km' })

  await day.hover()
  await expect(readout).toContainText('22 July 2026')
  await expect(readout).toContainText('5.01 km')

  await day.click()

  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByRole('dialog').getByRole('heading', { name: /W3D2/ })).toBeVisible()
  await expect(page).toHaveURL(/#overview\/\d+$/)
})

test('shows a multi-run day without opening one activity', async ({ page }) => {
  await loadApp(page)

  await page.getByRole('button', { name: '27 Sep 2026: 11.5 km, 2 runs' }).click()

  await expect(page.getByRole('dialog')).toHaveCount(0)
  const readout = calendar(page).locator('[aria-live="polite"]')
  await expect(readout).toContainText('11.53 km')
  await expect(readout).toContainText('2 runs')
})
