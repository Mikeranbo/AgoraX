import { test, expect, Page } from '@playwright/test';
import { card, goToList, openSite, seed } from './helpers';

/**
 * Telecommunicatiewet 11.7a / privacy notice 1.1 section 2: opening the site stores nothing on
 * the device and creates no ID. Each test runs in a fresh browser context.
 */
test.beforeEach(async () => {
  await seed();
});

async function deviceStorage(page: Page) {
  return page.evaluate(async () => ({
    local: Object.keys(localStorage),
    session: Object.keys(sessionStorage),
    idb: ((await indexedDB.databases?.()) ?? []).map((d) => d.name),
    cookie: document.cookie,
  }));
}

test('a fresh visit with ?src= and no clicks stores nothing on the device', async ({ page, context }) => {
  await page.goto('/?src=test');
  // The events load from the database without any ID.
  await expect(page.locator('article').first()).toBeAttached({ timeout: 20_000 });
  await page.waitForTimeout(3000);
  expect(await deviceStorage(page)).toEqual({ local: [], session: [], idb: [], cookie: '' });
  expect(await context.cookies()).toEqual([]);
});

test('a shared event link with no clicks stores nothing either', async ({ page, context }) => {
  await page.goto('/?ref=abcd1234&e=pottery');
  await page.waitForTimeout(4000);
  expect(await deviceStorage(page)).toEqual({ local: [], session: [], idb: [], cookie: '' });
  expect(await context.cookies()).toEqual([]);
});

test('the first "I\'m interested" creates the ID; the source is attached to it', async ({ page }) => {
  await openSite(page, { answerStats: false, path: '/?src=test' });
  // Closing the pilot notice is a click; it may only keep that answer, nothing else.
  let stored = await deviceStorage(page);
  expect(stored.idb).toEqual([]);
  expect(stored.local).not.toContain('agorax_id');
  await goToList(page);
  await card(page, 'Pottery evening').getByRole('button', { name: "I'm interested" }).click();
  await expect(card(page, 'Pottery evening').getByText('Interested')).toBeVisible();
  stored = await deviceStorage(page);
  expect(stored.idb).toContain('firebaseLocalStorageDb');
  expect(stored.local).toEqual(expect.arrayContaining(['agorax_id', 'agorax_src']));
  expect(await page.evaluate(() => localStorage.getItem('agorax_src'))).toBe('test');
});

test('Privacy & my data with no ID: nothing to delete, and opening it creates nothing', async ({ page }) => {
  await openSite(page, { answerStats: false });
  await page.getByRole('contentinfo').getByRole('button', { name: 'Privacy & my data' }).click();
  await expect(page.getByText('This browser has no ID yet').first()).toBeVisible();
  expect((await deviceStorage(page)).idb).toEqual([]);
  // The statistics answer is as easy to change as to give: one tap each way.
  await page.getByRole('group', { name: 'Your statistics answer' }).getByRole('button', { name: 'No thanks' }).click();
  expect(await page.evaluate(() => localStorage.getItem('agorax_stats_consent'))).toBe('no');
  await page.getByRole('group', { name: 'Your statistics answer' }).getByRole('button', { name: 'Allow' }).click();
  expect(await page.evaluate(() => localStorage.getItem('agorax_stats_consent'))).toBe('yes');
});

test('Delete everything removes the ID and what this browser kept', async ({ page }) => {
  await openSite(page);
  await goToList(page);
  await card(page, 'Pottery evening').getByRole('button', { name: "I'm interested" }).click();
  await expect(card(page, 'Pottery evening').getByText('Interested')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('contentinfo').getByRole('button', { name: 'Privacy & my data' }).click();
  await page.getByRole('button', { name: 'Delete my data and account' }).click();
  await page.getByRole('button', { name: 'Yes, delete it all' }).click();
  await expect(page.getByText('Done. This account is deleted.')).toBeVisible();
  const stored = await deviceStorage(page);
  expect(stored.local).toEqual([]);
  expect(stored.session).toEqual([]);
});
