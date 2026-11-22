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

test('an empty scheduled list explains itself instead of showing proposals', async ({ page }) => {
  await openSite(page);
  await goToList(page);
  await page.getByRole('radio', { name: 'Scheduled' }).click();
  await page.getByRole('group', { name: 'Categories' }).getByRole('button', { name: 'Creative', exact: true }).click();
  await expect(page.getByText('Nothing matches these filters.')).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters' }).first().click();
  await expect(card(page, 'Pub quiz night')).toBeVisible();
});

// concept-current removed the location and date filter box (src/config/concept.ts).
test('the city, location and date filters are gone; search, categories and Proposals / Scheduled stay', async ({ page }) => {
  await openSite(page);
  await goToList(page);
  await expect(page.getByRole('combobox', { name: 'City' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Use my location' })).toHaveCount(0);
  await expect(page.getByRole('group', { name: 'Location' })).toHaveCount(0);
  await expect(page.getByRole('group', { name: 'Date, coming soon' })).toHaveCount(0);
  await expect(page.getByText('How "near" works')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Search events' })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Categories' })).toBeVisible();
  await expect(page.getByRole('radio', { name: 'Scheduled' })).toBeVisible();
  await expect(page.locator('video')).toHaveCount(0);
});

test('no opening hero: the first visit starts at the pilot notice, under a slim bar with the logo', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('dialog', { name: 'A quick note: this is a pilot' })).toBeVisible();
  await expect(page.getByRole('button', { name: /to explore/ })).toHaveCount(0);
});
