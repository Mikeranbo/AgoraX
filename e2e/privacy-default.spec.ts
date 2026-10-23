import { test, expect } from '@playwright/test';
import { fromAccountMenu, openSite, seed } from './helpers';

// Runs against the default build (VITE_PRIVACY_NOTICE_FINAL unset), the way the site ships
// while the privacy notice is a draft: no new kinds of personal data are collected.

test.beforeEach(async () => {
  await seed();
});

test('with the draft notice, profile photos, bio and organiser identity are not collected', async ({ page }) => {
  await openSite(page);
  await fromAccountMenu(page, 'Profile');
  await page.getByRole('button', { name: 'Edit profile' }).click();
  const sheet = page.getByRole('dialog', { name: 'Edit profile' });
  await expect(sheet.getByText("Until then we don't collect them.")).toBeVisible();
  await expect(sheet.locator('input[type=file]')).toHaveCount(0);
  await expect(sheet.getByLabel('Short bio (optional)')).toHaveCount(0);
  await expect(sheet.getByLabel('Display name')).toBeVisible();
});

test('with the draft notice, launch news and invitations are not offered', async ({ page }) => {
  await openSite(page);
  await fromAccountMenu(page, 'Notification preferences');
  await expect(page.getByRole('switch', { name: 'When AgoraX launches' })).toHaveCount(0);
  await expect(page.getByText('once our privacy notice is final')).toBeVisible();
  await page.getByRole('button', { name: 'Add' }).click();
  await expect(page.getByRole('dialog', { name: 'Hear whether it goes ahead' }).getByRole('checkbox')).toHaveCount(1);
});
