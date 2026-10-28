import { expect, test } from '@playwright/test'
import { fileURLToPath } from 'node:url'

const CSV = fileURLToPath(new URL('../i463508_activities.csv', import.meta.url))

test('shows the Orbit brand', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle('Orbit')
  await expect(page.getByRole('heading', { name: 'Orbit', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Welcome to Orbit' })).toBeVisible()
})

test('keeps a theme saved under the old key', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.setItem('st.theme', 'dark'))
  await page.reload()

  await expect(page.locator('html')).toHaveClass(/dark/)
})

test('loads data saved under the old keys', async ({ page }) => {
  await page.goto('/')
  await page.locator('input[type=file]').setInputFiles(CSV)
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible()

  const saved = await page.evaluate(() => ({
    activities: localStorage.getItem('orbit.activities.v1'),
    meta: localStorage.getItem('orbit.meta.v1'),
    overrides: localStorage.getItem('orbit.raceOverrides.v1'),
  }))
  if (!saved.activities || !saved.meta) throw new Error('The import was not saved')

  await page.evaluate(
    ({ activities, meta, overrides }) => {
      localStorage.clear()
      localStorage.setItem('st.activities.v1', activities)
      localStorage.setItem('st.meta.v1', meta)
      if (overrides) localStorage.setItem('st.raceOverrides.v1', overrides)
    },
    saved,
  )
  await page.reload()

  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible()
})
