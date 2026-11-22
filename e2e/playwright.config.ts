import { defineConfig } from '@playwright/test';

/**
 * Browser tests against the local Firebase emulators only (npm run test:e2e starts them under
 * the demo-agorax project). Both dev servers run with VITE_FIREBASE_EMULATORS=1, so the app
 * cannot reach the real project:
 *  - :5179 with VITE_PRIVACY_NOTICE_FINAL and VITE_EXTRA_DATA_FEATURES, so the profile and opt-in tools can be tested;
 *  - :5180 with the default settings, to prove those tools stay off unless switched on.
 * PW_CHROMIUM_PATH points at a preinstalled Chromium when Playwright's own download is not used.
 */
const DEFAULT_BUILD = 'privacy-default.spec.ts';
/**
 * Branch concept-simple hides the menu, My account, the location and date filters and the opening
 * screens (src/config/concept.ts), which these files test. They still run on main and concept-current;
 * here concept-simple.spec.ts and storage.spec.ts cover the page.
 */
const HIDDEN_ON_THIS_BRANCH = ['navigation.spec.ts', 'filters.spec.ts', 'organiser.spec.ts', 'pilot.spec.ts', 'profile.spec.ts', DEFAULT_BUILD];

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
    { name: 'phone', testIgnore: HIDDEN_ON_THIS_BRANCH, use: { baseURL: 'http://127.0.0.1:5179', viewport: { width: 390, height: 844 }, hasTouch: true } },
    { name: 'laptop', testIgnore: HIDDEN_ON_THIS_BRANCH, use: { baseURL: 'http://127.0.0.1:5179', viewport: { width: 1280, height: 800 } } },
    // default-build: its checks need My account, which this branch hides.
    { name: 'default-build', testMatch: DEFAULT_BUILD, testIgnore: DEFAULT_BUILD, use: { baseURL: 'http://127.0.0.1:5180', viewport: { width: 390, height: 844 } } },
  ],
  // cwd: the repo root. Playwright otherwise runs these from e2e/, where Vite finds no index.html.
  webServer: [
    {
      command: 'npx vite --port 5179 --strictPort --host 127.0.0.1',
      cwd: '..',
      url: 'http://127.0.0.1:5179',
      reuseExistingServer: true,
      env: { VITE_FIREBASE_EMULATORS: '1', VITE_PRIVACY_NOTICE_FINAL: 'true', VITE_EXTRA_DATA_FEATURES: 'true' },
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
