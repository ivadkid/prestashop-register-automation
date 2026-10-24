import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Every test spins up its own demo shop instance, which takes a while and the demo
     servers are slow, so the timeouts are more generous than Playwright's defaults. */
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  /* The public demo occasionally answers 502 Bad Gateway. One retry absorbs that
     infrastructure noise; Playwright still marks such a test as "flaky" in the report. */
  retries: 1,
  /* A couple of workers keeps the run fast without hammering a shared public demo. */
  workers: 2,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    navigationTimeout: 60_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
});
