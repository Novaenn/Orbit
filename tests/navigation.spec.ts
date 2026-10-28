import { expect, test } from '@playwright/test'
import { fileURLToPath } from 'node:url'

const CSV = fileURLToPath(new URL('../mock-activities.csv', import.meta.url))

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true })

test('keeps navigation responsive during the page fade', async ({ page }) => {
  await page.goto('/')
  await page.locator('input[type=file]').setInputFiles(CSV)

  const nav = page.getByRole('navigation', { name: 'Main' })
  await expect(nav).toBeVisible()

  const centers = await nav.locator('button').evaluateAll((buttons) =>
    buttons.map((button) => {
      const rect = button.getBoundingClientRect()
      return {
        label: button.textContent?.trim() ?? '',
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2,
      }
    }),
  )
  const races = centers.find((center) => center.label === 'Races')
  const insights = centers.find((center) => center.label === 'Insights')
  if (!races || !insights) throw new Error('Navigation destinations not found')

  // Slow the page down so a snapshot-capture pause would be easy to hit.
  const client = await page.context().newCDPSession(page)
  await client.send('Emulation.setCPUThrottlingRate', { rate: 4 })

  await page.touchscreen.tap(races.x, races.y)

  // The fade runs on the content wrapper, not on a view-transition snapshot.
  await expect(page.locator('main .md-fade-through')).toHaveCSS('animation-name', 'md-fade-in')

  // A second tap during that fade must still switch tabs.
  await page.touchscreen.tap(insights.x, insights.y)

  await expect(page.getByRole('heading', { name: 'Training insights' })).toBeVisible()
  await expect(nav.getByRole('button', { name: 'Insights' })).toHaveAttribute('aria-current', 'page')
})
