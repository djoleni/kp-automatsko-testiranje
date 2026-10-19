import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 180_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'https://www.kupujemprodajem.com',
    locale: 'sr-RS',
    timezoneId: 'Europe/Belgrade',
    viewport: { width: 1440, height: 900 },
    screenshot: 'on',          // slika za svaki test (traži se u zadatku)
    actionTimeout: 15_000,
    navigationTimeout: 90_000,
    trace: 'retain-on-failure',
    video: 'off',            // video traži ffmpeg (dodatno preuzimanje)
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },

    // Opciono:
    // { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    // { name: 'edge',   use: { ...devices['Desktop Edge'], channel: 'msedge' } }, // traži instaliran Edge
  ],
});
