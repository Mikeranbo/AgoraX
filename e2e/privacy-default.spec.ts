import { test, expect } from '@playwright/test';
import { fromAccountMenu, openSite, seed } from './helpers';

// Runs against the default build (VITE_EXTRA_DATA_FEATURES unset), the way the site ships:
// privacy notice 1.1 does not cover public profiles or launch/invitation emails, so they stay off.

test.beforeEach(async () => {
  await seed();
});

test('without the extra features, profile photos, bio and organiser identity are not collected', async ({ page }) => {
  await openSite(page);
  await fromAccountMenu(page, 'Profile');
  await page.getByRole('button', { name: 'Edit profile' }).click();
  const sheet = page.getByRole('dialog', { name: 'Edit profile' });
  await expect(sheet.getByText("so we don't collect them.")).toBeVisible();
  await expect(sheet.locator('input[type=file]')).toHaveCount(0);
  await expect(sheet.getByLabel('Short bio (optional)')).toHaveCount(0);
  await expect(sheet.getByLabel('Display name')).toBeVisible();
});

test('without the extra features, launch news and invitations are not offered', async ({ page }) => {
  await openSite(page);
  await fromAccountMenu(page, 'Notification preferences');
  await expect(page.getByRole('switch', { name: 'When AgoraX launches' })).toHaveCount(0);
  await expect(page.getByText("We don't send launch news")).toBeVisible();
  await page.getByRole('button', { name: 'Add' }).click();
  // Only the age check and the one consent this form is for.
  const boxes = page.getByRole('dialog', { name: 'Hear whether it goes ahead' }).getByRole('checkbox');
  await expect(boxes).toHaveCount(2);
  await expect(boxes.first()).toHaveAccessibleName("I'm 16 or older.");
});

test('visit statistics stay off until the visitor allows them', async ({ page }) => {
  await openSite(page, { answerStats: false });
  const stats = page.getByRole('region', { name: 'Visit statistics' });
  await expect(stats).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('agorax_stats_consent'))).toBeNull();
  await stats.getByRole('button', { name: 'Allow' }).click();
  await expect(stats).toBeHidden();
  expect(await page.evaluate(() => localStorage.getItem('agorax_stats_consent'))).toBe('yes');
});
