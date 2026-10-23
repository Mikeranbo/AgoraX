import { test, expect } from '@playwright/test';
import { card, goToList, openSite, seed } from './helpers';

test.beforeEach(async () => {
  await seed();
});

test('the pilot is explained up front, without booking or popularity language', async ({ page }) => {
  await openSite(page);
  await expect(page.getByText('AgoraX is a pilot, not a booking service.')).toBeVisible();
  await expect(page.getByText(/aim to run one to three of the most-supported/)).toBeVisible();
  await expect(page.getByText(/doesn't guarantee the event will happen/)).toBeVisible();
  await goToList(page);
  await expect(page.getByText(/This is happening|Buy ticket|Booking confirmed|people viewing|left!/i)).toHaveCount(0);
});

test('proposals are labelled, show indicative prices, and never show placeholder dates', async ({ page }) => {
  await openSite(page);
  await goToList(page);
  const chess = card(page, 'Chess café');
  await expect(chess.getByText('Proposal', { exact: true })).toBeVisible();
  await expect(chess.getByText('Date to be confirmed')).toBeVisible();
  await expect(chess.getByText('indicative price')).toBeVisible();
  await expect(chess.getByText(/est\. €\d+ for a host/)).toBeVisible();
  await expect(chess.getByText(/Closes \d/)).toHaveCount(0);
});

test('interest counts once per person: join, withdraw and rejoin, even when tapped twice', async ({ page }) => {
  await openSite(page);
  await goToList(page);
  const chess = card(page, 'Chess café');
  await expect(chess.getByText('0 interested')).toBeVisible();

  await chess.getByRole('button', { name: "I'm interested" }).dblclick();
  await expect(chess.getByText('Interested', { exact: true })).toBeVisible();
  await expect(chess.getByText('1 interested')).toBeVisible();

  // A new visitor's first interest is followed by the price question; skip it.
  await page.getByRole('button', { name: 'Skip' }).click();

  await chess.getByRole('button', { name: 'Withdraw interest in Chess café' }).click();
  await expect(chess.getByText('0 interested')).toBeVisible();
  await chess.getByRole('button', { name: "I'm interested" }).click();
  await expect(chess.getByText('1 interested')).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'More events' }).click();
  await expect(card(page, 'Chess café').getByText('1 interested')).toBeVisible();
});

test('saving is separate from interest and is listed under Saved events', async ({ page }, info) => {
  await openSite(page);
  await goToList(page);
  const pottery = card(page, 'Pottery evening');
  await pottery.getByRole('button', { name: 'Save Pottery evening for later' }).click();
  await expect(pottery.getByRole('button', { name: /Saved: Pottery evening/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(pottery.getByText('0 interested')).toBeVisible();

  if (info.project.name === 'phone') {
    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.getByRole('dialog', { name: 'Menu' }).getByRole('button', { name: /Saved events/ }).click();
  } else {
    await page.locator('#site-menu-desktop').getByRole('button', { name: /Saved events/ }).click();
  }
  await expect(page.getByRole('heading', { name: 'Saved events' })).toBeVisible();
  await expect(card(page, 'Pottery evening')).toBeVisible();
  await expect(page.getByText("Saving doesn't count as interest.")).toBeVisible();
});

test('the timing preference is labelled as a preference and saved', async ({ page }, info) => {
  await openSite(page);
  await goToList(page);
  await card(page, 'Chess café').getByRole('button', { name: "I'm interested" }).click();
  await page.getByRole('button', { name: 'Skip' }).click();
  if (info.project.name === 'phone') await page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: /Interests/ }).click();
  else await page.locator('#site-menu-desktop').getByRole('button', { name: /My interests/ }).click();
  await expect(page.getByText('A preference to help us plan, not a promise of a date or of your availability.')).toBeVisible();
  await page.getByText('Weekends', { exact: true }).click();
  await expect(page.getByRole('radio', { name: 'Weekends' })).toBeChecked();
  await page.reload();
  await page.getByRole('button', { name: 'See my interests' }).click();
  await expect(page.getByRole('radio', { name: 'Weekends' })).toBeChecked();
});
