import { test, expect, Page } from '@playwright/test';
import { card, visitorUid } from './helpers';
import { makeOwner, seedRealEvents } from './seed-real';
import { readDoc } from './seed.mjs';

/**
 * The A/B test with the real coin flip (server :5183): one link shows page A or page B, nothing is
 * stored before the first action on either, ?v= forces a page without counting it, and a pick
 * lands under the right page on /admin.
 */
test.beforeEach(async () => {
  await seedRealEvents();
});

const PAGE_A_HEADING = "Pick the events you'd actually go to.";
const NOTICE = 'A quick note: this is a pilot';

/** Which page this load shows: A has the explainer heading, B opens with the pilot notice. */
async function whichPage(page: Page): Promise<'A' | 'B'> {
  const a = page.getByRole('heading', { name: PAGE_A_HEADING });
  const b = page.getByRole('dialog', { name: NOTICE });
  await expect(a.or(b).first()).toBeVisible({ timeout: 20_000 });
  return (await a.isVisible()) ? 'A' : 'B';
}

async function deviceStorage(page: Page) {
  return page.evaluate(async () => ({
    local: Object.keys(localStorage),
    session: Object.keys(sessionStorage),
    idb: ((await indexedDB.databases?.()) ?? []).map((d) => d.name),
    cookie: document.cookie,
  }));
}

const EMPTY = { local: [], session: [], idb: [], cookie: '' };

test('one link shows both pages across reloads, and nothing is stored before a click on either', async ({ page, context }) => {
  const seen = new Set<string>();
  await page.goto('/?src=test');
  for (let i = 0; i < 16 && seen.size < 2; i++) {
    if (i > 0) await page.reload();
    seen.add(await whichPage(page));
    await page.waitForTimeout(1500);
    expect(await deviceStorage(page)).toEqual(EMPTY);
  }
  expect([...seen].sort()).toEqual(['A', 'B']);
  expect(await context.cookies()).toEqual([]);
});

test('?v=simple and ?v=current force a page, are not counted, and mark what they save as a test', async ({ page }) => {
  await page.goto('/?v=simple&src=abcheck');
  expect(await whichPage(page)).toBe('A');
  await page.waitForTimeout(1500);
  expect(await deviceStorage(page)).toEqual(EMPTY);

  await page.goto('/?v=current&src=abcheck');
  expect(await whichPage(page)).toBe('B');
  await page.waitForTimeout(1500);
  expect(await deviceStorage(page)).toEqual(EMPTY);
  // Neither load reached the visit counter.
  expect(await readDoc('visits/abcheck')).toBeUndefined();

  // A pick on a forced page is saved as a test, and the browser keeps that page.
  await page.goto('/?v=simple&src=abcheck');
  await page.getByRole('region', { name: 'Visit statistics' }).getByRole('button', { name: 'No thanks' }).click();
  await card(page, 'Chess Challenge').getByRole('button', { name: "I'd go" }).click();
  await expect(page.getByRole('dialog', { name: 'Hear whether it goes ahead' })).toBeVisible();
  const uid = await visitorUid(page);
  expect(await page.evaluate(() => localStorage.getItem('agorax_variant'))).toBe('simple-test');
  expect(((await readDoc(`users/${uid}`)) as any)?.variant).toBe('simple-test');
  expect(((await readDoc(`events/chess-challenge/participants/${uid}`)) as any)?.variant).toBe('simple-test');
  await page.goto('/');
  expect(await whichPage(page)).toBe('A');
  expect(await readDoc('visits/direct')).toBeUndefined();
});

/** A pick, a contact and the owner's view, for a coin flip forced to one side. */
async function fullPath(page: Page, side: 'A' | 'B') {
  // Many steps plus the lazy-loaded /admin page: more than the default minute on a cold dev server.
  test.setTimeout(120_000);
  // The coin flip reads Math.random once, when the page loads.
  await page.addInitScript((v) => {
    Math.random = () => v;
  }, side === 'A' ? 0.1 : 0.9);
  await page.goto('/?src=test');
  expect(await whichPage(page)).toBe(side);
  if (side === 'B') await page.getByRole('dialog', { name: NOTICE }).getByRole('button', { name: 'Got it — explore' }).click();
  await page.getByRole('region', { name: 'Visit statistics' }).getByRole('button', { name: 'No thanks' }).click();

  const event = card(page, 'Film Club (watch + talk)');
  await event.getByRole('button', { name: side === 'A' ? "I'd go" : "I'm interested" }).click();
  if (side === 'B') {
    // Page B: the price question first, then the banner asks for a contact.
    await page.getByRole('button', { name: 'Skip' }).click();
    await page.getByRole('button', { name: 'Add it' }).click();
  }
  const contact = page.getByRole('dialog', { name: 'Hear whether it goes ahead' });
  await contact.getByLabel('or WhatsApp number').fill('06 12345678');
  await contact.getByLabel("I'm 16 or older.").check();
  await contact.getByRole('checkbox', { name: /goes ahead, is cancelled/ }).check();
  await contact.getByRole('button', { name: 'Save' }).click();
  await expect(contact).toBeHidden();
  if (side === 'A') await page.getByRole('dialog', { name: 'One quick question' }).getByRole('button', { name: 'Skip' }).click();

  const uid = await visitorUid(page);
  expect(await page.evaluate(() => localStorage.getItem('agorax_variant'))).toBe(side === 'A' ? 'simple' : 'current');
  const visits = (await readDoc('visits/test')) as Record<string, number> | undefined;
  expect(visits?.[side === 'A' ? 'simple' : 'current']).toBe(1);
  expect(visits?.[side === 'A' ? 'current' : 'simple']).toBeUndefined();

  await makeOwner(uid);
  await page.goto('/admin');
  const ab = page.locator('section', { has: page.getByRole('heading', { name: 'A/B test' }) });
  const col = side === 'A' ? 1 : 2;
  const other = side === 'A' ? 2 : 1;
  const row = (name: string) => ab.locator('tr', { hasText: name }).locator('td');
  await expect(row('Visits (page loads)').nth(col)).toHaveText('1', { timeout: 20_000 });
  await expect(row('Visits (page loads)').nth(other)).toHaveText('0');
  await expect(row('Picked at least one event').nth(col)).toHaveText('1 · 100%');
  await expect(row('Left a contact').nth(col)).toHaveText('1 · 100%');
  await expect(row('Picked at least one event').nth(other)).toHaveText(/^0 · /);
  const film = ab.locator('tr', { hasText: 'Film Club' }).locator('td');
  await expect(film.nth(side === 'A' ? 1 : 3)).toHaveText('1');
}

test('full path on page A: ?src=test, pick, contact, /admin shows it under A', async ({ page }) => {
  await fullPath(page, 'A');
});

test('full path on page B: ?src=test, pick, contact, /admin shows it under B', async ({ page }) => {
  await fullPath(page, 'B');
});
