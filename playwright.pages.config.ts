import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  testMatch: 'pages.spec.ts',
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4175',
    channel: 'chrome',
    viewport: { width: 1280, height: 900 },
  },
  webServer: {
    command: 'npm run build:pages && npm run preview:pages',
    url: 'http://127.0.0.1:4175/Orbit/',
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
