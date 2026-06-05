import { defineConfig, devices } from '@playwright/test';

const E2E_PORT = 4201;
const TEST_API_URL = process.env['TEST_API_URL'] ?? 'http://localhost:8001/api/v1';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: `http://localhost:${E2E_PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',

  webServer: {
    command: `ng serve --configuration e2e --port ${E2E_PORT}`,
    url: `http://localhost:${E2E_PORT}`,
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
    env: {
      TEST_API_URL,
    },
  },
});
