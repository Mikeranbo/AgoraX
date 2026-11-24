import { test, expect, Page } from '@playwright/test';
import { card, goToList, openSite, seed } from './helpers';

/** The main button and its picked state, on every concept. */
const JOIN = /^(I'm interested|I'd go)$/;

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

test('the pilot notice shows on arrival; "Got it — explore" keeps only agorax.entry.done (both pages)', async ({ page }) => {
  await page.goto('/?src=test');
  const notice = page.getByRole('dialog', { name: 'A quick note: this is a pilot' });
  await expect(notice).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(2000);
  expect(await deviceStorage(page)).toEqual({ local: [], session: [], idb: [], cookie: '' });
  await notice.getByRole('button', { name: 'Got it — explore' }).click();
  await expect(notice).toBeHidden();
  // No ID, no saved page version, no pick: only that this tab saw the notice.
  expect(await deviceStorage(page)).toEqual({ local: [], session: ['agorax.entry.done'], idb: [], cookie: '' });
  // A reload in the same tab doesn't show the notice again.
  await page.reload();
  await expect(page.locator('article').first()).toBeVisible({ timeout: 20_000 });
  await expect(notice).toHaveCount(0);
});

test('the first "I\'m interested" creates the ID; the source is attached to it', async ({ page }) => {
  await openSite(page, { answerStats: false, path: '/?src=test' });
  // Closing the pilot notice is a click; it may only keep that answer, nothing else.
  let stored = await deviceStorage(page);
  expect(stored.idb).toEqual([]);
  expect(stored.local).not.toContain('agorax_id');
  await goToList(page);
  await card(page, 'Pottery evening').getByRole('button', { name: JOIN }).click();
  await expect(card(page, 'Pottery evening').getByRole('button', { name: /^Withdraw interest in/ })).toBeVisible();
  stored = await deviceStorage(page);
  expect(stored.idb).toContain('firebaseLocalStorageDb');
  expect(stored.local).toEqual(expect.arrayContaining(['agorax_id', 'agorax_src']));
  expect(await page.evaluate(() => localStorage.getItem('agorax_src'))).toBe('test');
});

test('Privacy & my data with no ID: nothing to delete, and opening it creates nothing', async ({ page }) => {
  // Answering the statistics question stores only that answer (and keeps the banner off the footer).
  await openSite(page);
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
  await card(page, 'Pottery evening').getByRole('button', { name: JOIN }).click();
  await expect(card(page, 'Pottery evening').getByRole('button', { name: /^Withdraw interest in/ })).toBeVisible();
  // Close whatever asks next (the price question, or on concept-simple the contact sheet first).
  for (let i = 0; i < 3 && (await page.getByRole('dialog').count()) > 0; i++) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }
  await page.getByRole('contentinfo').getByRole('button', { name: 'Privacy & my data' }).click();
  await page.getByRole('button', { name: 'Delete my data and account' }).click();
  await page.getByRole('button', { name: 'Yes, delete it all' }).click();
  await expect(page.getByText('Done. This account is deleted.')).toBeVisible();
  const stored = await deviceStorage(page);
  expect(stored.local).toEqual([]);
  expect(stored.session).toEqual([]);
});

test('"Help run this" works as the very first action: the offer creates the ID', async ({ page }) => {
  await openSite(page, { path: '/?e=chess' });
  // Page B: "Organize" in the sign-up card. Page A: "Help run this" next to "I'd go".
  await page.getByRole('button', { name: /^(Organize|Help run this)/ }).first().click();
  const panel = page.getByRole('dialog', { name: 'Organize this event' });
  await panel.getByRole('button', { name: "I'd help run this" }).click();
  await panel.getByLabel('First name').fill('Robin');
  await panel.getByLabel('Email').fill('robin@example.com');
  await panel.getByText('Sort of').click();
  await panel.getByLabel("I'm 16 or older.").check();
  await panel.getByRole('checkbox', { name: /running this event/ }).check();
  expect((await deviceStorage(page)).idb).toEqual([]);
  await panel.getByRole('button', { name: 'Send' }).click();
  await expect(panel.getByText("you're on the list of possible hosts")).toBeVisible();
  expect((await deviceStorage(page)).idb).toContain('firebaseLocalStorageDb');
});
