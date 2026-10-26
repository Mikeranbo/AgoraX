import { test, expect } from '@playwright/test';
import { card, goToList, leaveIntro, openSite, seed } from './helpers';

test.beforeEach(async () => {
  await seed();
});

test('the pilot is explained up front, without booking or popularity language', async ({ page }) => {
  await page.goto('/');
  await leaveIntro(page);
  const notice = page.getByRole('dialog', { name: 'A quick note: this is a pilot' });
  await expect(notice.getByText(/Events are not confirmed\. Prices and potential earnings are hypothetical/)).toBeVisible();
  await expect(notice.getByText(/Showing interest is not a booking, and you won’t be charged/)).toBeVisible();
  await expect(notice.getByText(/does not make you the organiser/)).toBeVisible();
  await notice.getByRole('button', { name: 'Got it — explore' }).click();
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

/** The card's sign-up count, as in "1 of 8 needed to run". */
const signUps = (n: number) => new RegExp(`^${n} of \\d+$`);

test('interest counts once per person: join, withdraw and rejoin, even when tapped twice', async ({ page }) => {
  await openSite(page);
  await goToList(page);
  const chess = card(page, 'Chess café');
  await expect(chess.getByText(signUps(0))).toBeVisible();

  await chess.getByRole('button', { name: "I'm interested" }).dblclick();
  await expect(chess.getByText('Interested', { exact: true })).toBeVisible();
  await expect(chess.getByText(signUps(1))).toBeVisible();

  // A new visitor's first interest is followed by the price question; skip it.
  await page.getByRole('button', { name: 'Skip' }).click();

  await chess.getByRole('button', { name: 'Withdraw interest in Chess café' }).click();
  await expect(chess.getByText(signUps(0))).toBeVisible();
  await chess.getByRole('button', { name: "I'm interested" }).click();
  await expect(chess.getByText(signUps(1))).toBeVisible();
  await page.reload();
  await expect(card(page, 'Chess café').getByText(signUps(1))).toBeVisible();
});

test('saving is separate from interest and is listed under Saved events', async ({ page }, info) => {
  await openSite(page);
  await goToList(page);
  const pottery = card(page, 'Pottery evening');
  await pottery.getByRole('button', { name: 'Save Pottery evening for later' }).click();
  await expect(pottery.getByRole('button', { name: /Saved: Pottery evening/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(pottery.getByText(signUps(0))).toBeVisible();

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
  const openInterests = async () => {
    if (info.project.name === 'phone') await page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: /Interests/ }).click();
    else await page.locator('#site-menu-desktop').getByRole('button', { name: /My interests/ }).click();
  };
  await openInterests();
  await expect(page.getByText('A preference to help us plan, not a promise of a date or of your availability.')).toBeVisible();
  await page.getByText('Weekends', { exact: true }).click();
  await expect(page.getByRole('radio', { name: 'Weekends' })).toBeChecked();
  // A reload in the same tab lands on the list (the entry flow doesn't replay).
  await page.reload();
  await openInterests();
  await expect(page.getByRole('radio', { name: 'Weekends' })).toBeChecked();
});
