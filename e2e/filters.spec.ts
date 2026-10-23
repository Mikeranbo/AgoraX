import { test, expect } from '@playwright/test';
import { card, goToList, openSite, seed } from './helpers';

test.beforeEach(async () => {
  await seed();
});

const visible = async (page: import('@playwright/test').Page, title: string) => (await card(page, title).count()) > 0;

test('scheduled events and proposals are separate lists', async ({ page }) => {
  await openSite(page);
  await goToList(page);
  await expect(card(page, 'Chess café')).toHaveCount(1);
  await expect(card(page, 'Pub quiz night')).toHaveCount(0);

  await page.getByRole('radio', { name: 'Scheduled' }).click();
  const quiz = card(page, 'Pub quiz night');
  await expect(quiz).toBeVisible();
  await expect(quiz.getByText('Confirmed', { exact: true })).toBeVisible();
  await expect(quiz.getByText(/\w{3} \d{1,2} \w{3}, \d{2}:\d{2} CES?T/)).toBeVisible();
  // The proposal with a seeded placeholder date is never listed as scheduled.
  await expect(card(page, 'Chess café')).toHaveCount(0);
});

test('Today and Tomorrow only list real scheduled events', async ({ page }) => {
  await openSite(page);
  await goToList(page);
  await page.getByRole('radio', { name: 'Scheduled' }).click();
  const settled = () => expect(card(page, 'Pub quiz night').or(page.getByText('Nothing matches these filters.'))).toBeVisible();
  await page.getByRole('button', { name: 'Today' }).click();
  await settled();
  const today = await visible(page, 'Pub quiz night');
  await page.getByRole('button', { name: 'Tomorrow' }).click();
  await settled();
  const tomorrow = await visible(page, 'Pub quiz night');
  // Seeded two hours from now: today in Amsterdam, or tomorrow late at night, never both.
  expect(today !== tomorrow).toBe(true);
  await expect(card(page, 'Chess café')).toHaveCount(0);
});

test('an empty scheduled list explains itself instead of showing proposals', async ({ page }) => {
  await openSite(page);
  await goToList(page);
  await page.getByRole('radio', { name: 'Scheduled' }).click();
  await page.getByRole('group', { name: 'Categories' }).getByRole('button', { name: 'Creative', exact: true }).click();
  await expect(page.getByText('Nothing matches these filters.')).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters' }).first().click();
  await expect(card(page, 'Pub quiz night')).toBeVisible();
});

test('near / other locations combine with categories, and Clear filters resets them', async ({ page }) => {
  await openSite(page);
  await goToList(page);
  await page.getByRole('button', { name: 'Near Groningen' }).click();
  await expect(card(page, 'Drenthe walk')).toHaveCount(1); // Assen, ~25 km
  await expect(card(page, 'Chess café')).toHaveCount(1); // no city: the pilot city
  await expect(card(page, 'Amsterdam museum day')).toHaveCount(0);

  await page.getByRole('button', { name: 'Other locations' }).click();
  await expect(card(page, 'Amsterdam museum day')).toHaveCount(1);
  await expect(card(page, 'Chess café')).toHaveCount(0);

  await page.getByRole('group', { name: 'Categories' }).getByRole('button', { name: 'Outdoor', exact: true }).click();
  await expect(page.getByText('Nothing matches these filters.')).toBeVisible();
  await page.getByRole('button', { name: 'Near Groningen' }).click();
  await expect(card(page, 'Drenthe walk')).toHaveCount(1);
  await expect(card(page, 'Pottery evening')).toHaveCount(0);

  await page.getByRole('button', { name: 'Clear filters' }).first().click();
  await expect(page.getByRole('button', { name: 'All locations', pressed: true })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Categories' }).getByRole('button', { name: 'All', exact: true, pressed: true })).toBeVisible();
  await expect(card(page, 'Amsterdam museum day')).toHaveCount(1);
});

test('the browser is asked for a location only after "Use my location", and only the city is kept', async ({ browser }, info) => {
  const context = await browser.newContext({
    ...info.project.use,
    geolocation: { latitude: 52.37, longitude: 4.89 },
    permissions: ['geolocation'],
  });
  await context.addInitScript(() => {
    const original = navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);
    (window as any).__geoCalls = 0;
    navigator.geolocation.getCurrentPosition = (...args: Parameters<Geolocation['getCurrentPosition']>) => {
      (window as any).__geoCalls++;
      return original(...args);
    };
  });
  const page = await context.newPage();
  await openSite(page);
  await goToList(page);
  expect(await page.evaluate(() => (window as any).__geoCalls)).toBe(0);
  await page.getByRole('button', { name: 'Use my location' }).click();
  await expect(page.getByRole('button', { name: 'Near Amsterdam', pressed: true })).toBeVisible();
  expect(await page.evaluate(() => (window as any).__geoCalls)).toBe(1);
  await expect(card(page, 'Amsterdam museum day')).toHaveCount(1);
  await expect(card(page, 'Chess café')).toHaveCount(0);
  const stored = await page.evaluate(() => JSON.stringify(localStorage));
  expect(stored).toContain('Amsterdam');
  expect(stored).not.toMatch(/52\.37|4\.89/);
  await context.close();
});
