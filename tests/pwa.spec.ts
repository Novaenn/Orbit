import { expect, test } from '@playwright/test'

interface ManifestIcon {
  src: string
  sizes: string
  type: string
  purpose?: string
}

interface Manifest {
  name: string
  short_name: string
  display: string
  start_url: string
  scope: string
  theme_color: string
  background_color: string
  icons: ManifestIcon[]
}

test('serves an installable manifest with valid icons', async ({ request }) => {
  const response = await request.get('/manifest.webmanifest')
  expect(response.ok()).toBeTruthy()

  const manifest = (await response.json()) as Manifest
  expect(manifest).toMatchObject({
    name: 'Orbit',
    short_name: 'Orbit',
    display: 'standalone',
    start_url: '/',
    scope: '/',
    theme_color: '#3f51b5',
  })

  const sizes = manifest.icons.map((icon) => icon.sizes)
  expect(sizes).toContain('192x192')
  expect(sizes).toContain('512x512')
  expect(manifest.icons.some((icon) => icon.purpose === 'maskable')).toBe(true)

  for (const icon of manifest.icons) {
    const iconResponse = await request.get(icon.src.startsWith('/') ? icon.src : `/${icon.src}`)
    expect(iconResponse.ok()).toBeTruthy()
    expect(iconResponse.headers()['content-type']).toContain('image/png')
  }
})

test('works offline after the first visit', async ({ page, context }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Orbit', exact: true })).toBeVisible()

  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  // The first load installs the worker; reload once so it controls the page.
  await page.reload()
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null)

  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Orbit', exact: true })).toBeVisible()
  await context.setOffline(false)
})
