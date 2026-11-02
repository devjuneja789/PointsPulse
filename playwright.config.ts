import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 7'],
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: 'Desktop Chrome',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
  webServer: {
    command: 'node dist/server/index.js',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
    env: {
      PORT: '3000',
      NODE_ENV: 'production',
      LLM_MODE: 'mock',
    },
  },
});
