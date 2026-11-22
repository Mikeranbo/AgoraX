import { defineConfig } from '@playwright/test';

/**
 * Browser tests against the local Firebase emulators only (npm run test:e2e starts them under
 * the demo-agorax project). Every dev server runs with VITE_FIREBASE_EMULATORS=1, so the app
 * cannot reach the real project.
 *
 * The site is an A/B test (src/config/concept.ts): page A (simple) or page B (current). The coin
 * flip is replaced with VITE_AB_VARIANT so each server always shows one page:
 *  - :5179 page B, with VITE_PRIVACY_NOTICE_FINAL and VITE_EXTRA_DATA_FEATURES (profile and opt-in tools);
 *  - :5181 page A;
 *  - :5180 page B with the default settings, to prove the extra tools stay off unless switched on;
 *  - :5183 the real coin flip, for ab.spec.ts (both pages, ?v= override, nothing stored).
 * PW_CHROMIUM_PATH points at a preinstalled Chromium when Playwright's own download is not used.
 */
const PAGE_A = ['concept-simple.spec.ts', 'storage.spec.ts'];
const PAGE_B = ['navigation.spec.ts', 'filters.spec.ts', 'organiser.spec.ts', 'pilot.spec.ts', 'profile.spec.ts', 'storage.spec.ts', 'full-path.spec.ts'];
const DEFAULT_BUILD = 'privacy-default.spec.ts';
const AB = 'ab.spec.ts';

const phone = { viewport: { width: 390, height: 844 }, hasTouch: true };
const laptop = { viewport: { width: 1280, height: 800 } };

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
    { name: 'phone', testMatch: PAGE_B, use: { baseURL: 'http://127.0.0.1:5179', ...phone } },
    { name: 'laptop', testMatch: PAGE_B, use: { baseURL: 'http://127.0.0.1:5179', ...laptop } },
    { name: 'phone-A', testMatch: PAGE_A, use: { baseURL: 'http://127.0.0.1:5181', ...phone } },
    { name: 'laptop-A', testMatch: PAGE_A, use: { baseURL: 'http://127.0.0.1:5181', ...laptop } },
    { name: 'default-build', testMatch: DEFAULT_BUILD, use: { baseURL: 'http://127.0.0.1:5180', viewport: { width: 390, height: 844 } } },
    { name: 'phone-ab', testMatch: AB, use: { baseURL: 'http://127.0.0.1:5183', ...phone } },
    { name: 'laptop-ab', testMatch: AB, use: { baseURL: 'http://127.0.0.1:5183', ...laptop } },
  ],
  // cwd: the repo root. Playwright otherwise runs these from e2e/, where Vite finds no index.html.
  webServer: [
    {
      command: 'npx vite --port 5179 --strictPort --host 127.0.0.1',
      cwd: '..',
      url: 'http://127.0.0.1:5179',
      reuseExistingServer: true,
      env: { VITE_FIREBASE_EMULATORS: '1', VITE_PRIVACY_NOTICE_FINAL: 'true', VITE_EXTRA_DATA_FEATURES: 'true', VITE_AB_VARIANT: 'current' },
    },
    {
      command: 'npx vite --port 5181 --strictPort --host 127.0.0.1',
      cwd: '..',
      url: 'http://127.0.0.1:5181',
      reuseExistingServer: true,
      env: { VITE_FIREBASE_EMULATORS: '1', VITE_PRIVACY_NOTICE_FINAL: 'true', VITE_AB_VARIANT: 'simple' },
    },
    {
      command: 'npx vite --port 5180 --strictPort --host 127.0.0.1',
      cwd: '..',
      url: 'http://127.0.0.1:5180',
      reuseExistingServer: true,
      env: { VITE_FIREBASE_EMULATORS: '1', VITE_AB_VARIANT: 'current' },
    },
    {
      command: 'npx vite --port 5183 --strictPort --host 127.0.0.1',
      cwd: '..',
      url: 'http://127.0.0.1:5183',
      reuseExistingServer: true,
      env: { VITE_FIREBASE_EMULATORS: '1', VITE_PRIVACY_NOTICE_FINAL: 'true' },
    },
  ],
});
