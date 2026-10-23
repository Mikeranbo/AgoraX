import { defineConfig } from '@playwright/test';

/**
 * Browser tests against the local Firebase emulators only (npm run test:e2e starts them under
 * the demo-agorax project). Both dev servers run with VITE_FIREBASE_EMULATORS=1, so the app
 * cannot reach the real project:
 *  - :5179 with VITE_PRIVACY_NOTICE_FINAL=true, so the profile and opt-in tools can be tested;
 *  - :5180 with the default settings, to prove those tools stay off while the notice is a draft.
 * PW_CHROMIUM_PATH points at a preinstalled Chromium when Playwright's own download is not used.
 */
const DEFAULT_BUILD = 'privacy-default.spec.ts';

export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.ts',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  use: {
    launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH || undefined },
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'phone', testIgnore: DEFAULT_BUILD, use: { baseURL: 'http://127.0.0.1:5179', viewport: { width: 390, height: 844 }, hasTouch: true } },
    { name: 'laptop', testIgnore: DEFAULT_BUILD, use: { baseURL: 'http://127.0.0.1:5179', viewport: { width: 1280, height: 800 } } },
    { name: 'default-build', testMatch: DEFAULT_BUILD, use: { baseURL: 'http://127.0.0.1:5180', viewport: { width: 390, height: 844 } } },
  ],
  // cwd: the repo root. Playwright otherwise runs these from e2e/, where Vite finds no index.html.
  webServer: [
    {
      command: 'npx vite --port 5179 --strictPort --host 127.0.0.1',
      cwd: '..',
      url: 'http://127.0.0.1:5179',
      reuseExistingServer: true,
      env: { VITE_FIREBASE_EMULATORS: '1', VITE_PRIVACY_NOTICE_FINAL: 'true' },
    },
    {
      command: 'npx vite --port 5180 --strictPort --host 127.0.0.1',
      cwd: '..',
      url: 'http://127.0.0.1:5180',
      reuseExistingServer: true,
      env: { VITE_FIREBASE_EMULATORS: '1' },
    },
  ],
});
