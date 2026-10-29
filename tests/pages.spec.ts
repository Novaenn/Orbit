import { expect, test } from '@playwright/test'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const CSV = fileURLToPath(new URL('../mock-activities.csv', import.meta.url))
const OUTPUT = fileURLToPath(new URL('../dist-pages/', import.meta.url))
const APP = '/Orbit/app/'

test('landing links open the dashboard under its own path', async ({ page }) => {
  const failures: string[] = []
  page.on('pageerror', error => failures.push(error.message))
  page.on('response', response => {
    if (response.status() >= 400) failures.push(response.url())
  })
  await page.goto('/Orbit/')
  await expect(page).toHaveTitle('Orbit — Every run. A clearer picture.')
  const buttons = page.getByRole('link', { name: /^Get Orbit/, includeHidden: true })
  // Three desktop buttons plus the mobile navigation link.
  await expect(buttons).toHaveCount(4)
  for (const button of await buttons.all()) await expect(button).toHaveAttribute('href', './app/')
  await buttons.first().click()
  await expect(page).toHaveURL(/\/Orbit\/app\/$/)
  await expect(page.getByRole('heading', { name: 'Welcome to Orbit' })).toBeVisible()
  expect(failures).toEqual([])
})

test('both manifest URLs retain the app identity and launch the new dashboard', async ({ request }) => {
  for (const path of ['/Orbit/manifest.webmanifest', `${APP}manifest.webmanifest`]) {
    const response = await request.get(path)
    expect(response.ok()).toBeTruthy()
    const manifest = await response.json()
    expect(manifest).toMatchObject({ id: '/Orbit/', start_url: APP, scope: APP, name: 'Orbit' })
    for (const icon of manifest.icons) {
      const image = await request.get(new URL(icon.src, response.url()).href)
      expect(image.ok()).toBeTruthy()
      expect(image.headers()['content-type']).toContain('image/png')
    }
  }
})

test('activities and preferences survive visits to the landing page', async ({ page }) => {
  await page.goto(APP)
  await page.locator('input[type=file]').setInputFiles(CSV)
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible()
  const saved = await page.evaluate(() => {
    localStorage.setItem('orbit.theme', 'dark')
    return localStorage.getItem('orbit.activities.v1')
  })
  await page.goto('/Orbit/')
  await page.getByRole('link', { name: /^Get Orbit/ }).first().click()
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible()
  await expect(page.locator('html')).toHaveClass(/dark/)
  expect(await page.evaluate(() => localStorage.getItem('orbit.activities.v1'))).toBe(saved)
})

test('offline caching stays within the dashboard path', async ({ page, context }) => {
  await page.goto(APP)
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null)
  expect(await page.evaluate(() => navigator.serviceWorker.controller?.scriptURL)).toContain('/Orbit/app/sw.js')
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Welcome to Orbit' })).toBeVisible()
  await context.setOffline(false)
  await page.goto('/Orbit/')
  expect(await page.evaluate(() => navigator.serviceWorker.controller)).toBeNull()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Every run.')
})

test('older home-screen launches reach the app and preserve the selected tab', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'standalone', { value: true }))
  await page.goto('/Orbit/?from=homescreen#races')
  await expect(page).toHaveURL(/\/Orbit\/app\/\?from=homescreen#races$/)
  await expect(page.getByRole('heading', { name: 'Welcome to Orbit' })).toBeVisible()
})

test('replaces the old caching worker without losing data or unrelated caches', async ({ page, context }) => {
  // Obtain real app storage to model an existing user's imported history.
  await page.goto(APP)
  await page.locator('input[type=file]').setInputFiles(CSV)
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible()
  const saved = await page.evaluate(() => ({ ...localStorage }))
  let legacy = true
  const migrationWorker = await readFile(new URL('../scripts/legacy-sw.js', import.meta.url), 'utf8')
  const oldHtml = '<!doctype html><html><body><h1>Legacy Orbit</h1></body></html>'
  const oldWorker = `
    self.addEventListener('install', e => e.waitUntil((async () => {
      const cache = await caches.open('workbox-precache-v2-' + self.registration.scope);
      await cache.put(self.registration.scope, new Response(${JSON.stringify(oldHtml)}, { headers: { 'Content-Type': 'text/html' } }));
      await self.skipWaiting();
    })()));
    self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
    self.addEventListener('fetch', e => {
      if (e.request.mode === 'navigate') e.respondWith(caches.match(self.registration.scope));
    });
  `
  const types: Record<string, string> = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2' }
  const server = createServer(async (request, response) => {
    try {
      const path = new URL(request.url!, 'http://localhost').pathname
      if (path === '/Orbit/sw.js') {
        response.writeHead(200, { 'Content-Type': 'text/javascript', 'Cache-Control': 'no-store' }).end(legacy ? oldWorker : migrationWorker)
      } else if (legacy && path === '/Orbit/') {
        response.writeHead(200, { 'Content-Type': 'text/html' }).end(oldHtml)
      } else {
        const relative = path.slice('/Orbit/'.length) + (path.endsWith('/') ? 'index.html' : '')
        const body = await readFile(resolve(OUTPUT, relative))
        response.writeHead(200, { 'Content-Type': types[extname(relative)] || 'application/octet-stream' }).end(body)
      }
    } catch { response.writeHead(404).end() }
  })
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Missing migration server address')
  const origin = `http://127.0.0.1:${address.port}`
  try {
    await page.goto(`${origin}/Orbit/#races`)
    await page.evaluate(async data => {
      Object.entries(data).forEach(([key, value]) => localStorage.setItem(key, value))
      await caches.open('another-project-cache')
      await navigator.serviceWorker.register('/Orbit/sw.js', { scope: '/Orbit/' })
      await navigator.serviceWorker.ready
    }, saved)
    await page.reload()
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null)
    await expect(page.getByRole('heading', { name: 'Legacy Orbit' })).toBeVisible()
    legacy = false
    await page.evaluate(() => { void navigator.serviceWorker.getRegistration('/Orbit/').then(registration => registration?.update()) })
    await expect(page).toHaveURL(`${origin}${APP}#races`, { timeout: 15_000 })
    await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible()
    expect(await page.evaluate(() => localStorage.getItem('orbit.activities.v1'))).toBe(saved['orbit.activities.v1'])
    const cacheNames = await page.evaluate(() => caches.keys())
    expect(cacheNames).toContain('another-project-cache')
    expect(cacheNames).not.toContain(`workbox-precache-v2-${origin}/Orbit/`)

    await page.evaluate(() => navigator.serviceWorker.ready)
    await page.reload()
    await context.setOffline(true)
    await page.reload()
    await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible()
    await context.setOffline(false)
    await page.goto(`${origin}/Orbit/`)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Every run.')
  } finally {
    await context.setOffline(false)
    await page.goto('about:blank')
    server.closeAllConnections()
    await new Promise<void>(resolve => server.close(() => resolve()))
  }
})
