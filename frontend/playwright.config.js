import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  expect: { timeout: 15000 },
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: process.env.E2E_BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  reporter: [['html', { open: 'never' }], ['list']],
})
