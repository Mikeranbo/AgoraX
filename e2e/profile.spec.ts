import { test, expect } from '@playwright/test';
import { fromAccountMenu, openMenu, openSite, seed } from './helpers';

test.beforeEach(async () => {
  await seed();
});

// A real 8x6 PNG (red), so the browser can decode and compress it.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAGCAIAAABxZ0isAAAAFUlEQVR4nGP4z8CAFTGMSmCTwCkBAMjFL9H0LlD9AAAAAElFTkSuQmCC',
  'base64',
);

test('profile: cover and picture can be validated, previewed, repositioned, removed and saved', async ({ page }) => {
  await openSite(page);
  await fromAccountMenu(page, 'Profile');
  await expect(page.getByRole('heading', { name: 'Guest' })).toBeVisible();
  await page.getByRole('button', { name: 'Edit profile' }).click();
  const sheet = page.getByRole('dialog', { name: 'Edit profile' });

  // Wrong format: refused before anything is processed.
  await sheet.locator('#pi-avatar').setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') });
  await expect(sheet.getByRole('alert').filter({ hasText: 'Use a JPEG, PNG or WebP picture.' })).toBeVisible();
  await sheet.locator('#pi-avatar').setInputFiles({ name: 'evil.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg/>') });
  await expect(sheet.getByRole('alert').filter({ hasText: 'Use a JPEG, PNG or WebP picture.' })).toBeVisible();

  await sheet.locator('#pi-avatar').setInputFiles({ name: 'me.png', mimeType: 'image/png', buffer: PNG });
  await expect(sheet.getByRole('button', { name: 'Replace' }).first()).toBeVisible();
  await sheet.locator('#pi-cover').setInputFiles({ name: 'cover.png', mimeType: 'image/png', buffer: PNG });
  await expect(sheet.getByLabel('Move the picture up or down')).toBeVisible();
  await sheet.getByLabel('Move the picture up or down').fill('20');

  // Remove and put back, to check Remove works.
  await sheet.getByRole('button', { name: 'Remove' }).first().click();
  await sheet.locator('#pi-cover').setInputFiles({ name: 'cover.png', mimeType: 'image/png', buffer: PNG });

  await sheet.getByLabel('Display name (required)').fill('');
  await sheet.getByRole('button', { name: 'Save profile' }).click();
  await expect(sheet.getByRole('alert').filter({ hasText: 'Add a display name.' })).toBeVisible();

  await sheet.getByLabel('Display name (required)').fill('Robin');
  await sheet.getByLabel('Short bio (optional)').fill('Board games and bouldering');
  await sheet.getByLabel('Area (optional)').fill('Groningen');
  await sheet.getByRole('button', { name: 'Save profile' }).click();
  await expect(sheet).toBeHidden();

  await expect(page.getByRole('heading', { name: 'Robin' })).toBeVisible();
  await expect(page.getByText('Board games and bouldering')).toBeVisible();
  const menu = await openMenu(page);
  await expect(menu.getByRole('button', { name: /Profile & settings/ }).locator('img')).toHaveAttribute('src', /^data:image\/jpeg;base64,/);
});

test('profile never shows private contact details', async ({ page }) => {
  await openSite(page);
  await fromAccountMenu(page, 'Notification preferences');
  await page.getByRole('button', { name: 'Add' }).click();
  const form = page.getByRole('dialog', { name: 'Hear whether it goes ahead' });
  await form.getByLabel('Email', { exact: true }).fill('robin@example.com');
  await form.getByLabel('or WhatsApp number').fill('06 12345678');
  await form.getByRole('checkbox').first().check();
  await form.getByRole('button', { name: 'Save' }).click();
  await expect(form).toBeHidden();

  await fromAccountMenu(page, 'Profile');
  await page.getByRole('button', { name: 'Edit profile' }).click();
  const sheet = page.getByRole('dialog', { name: 'Edit profile' });
  await sheet.getByLabel('Display name (required)').fill('Robin');
  await sheet.getByRole('button', { name: 'Save profile' }).click();
  await expect(sheet).toBeHidden();

  const profile = page.getByRole('region', { name: 'Profile' });
  await expect(profile).toBeVisible();
  await expect(profile).not.toContainText('robin@example.com');
  await expect(profile).not.toContainText('612345678');
  await expect(profile).toContainText('Your interests, saved events and contact details are never part of it.');
});

test('contact form: email or WhatsApp is enough, optional extras start unticked and need an email', async ({ page }) => {
  await openSite(page);
  await fromAccountMenu(page, 'Notification preferences');
  await page.getByRole('button', { name: 'Add' }).click();
  const form = page.getByRole('dialog', { name: 'Hear whether it goes ahead' });
  const boxes = form.getByRole('checkbox');
  await expect(boxes).toHaveCount(3);
  await expect(boxes.nth(1)).not.toBeChecked(); // launch news
  await expect(boxes.nth(2)).not.toBeChecked(); // invitations
  await expect(form.getByRole('button', { name: 'Privacy notice' })).toBeVisible();

  await form.getByRole('button', { name: 'Save' }).click();
  await expect(form.getByRole('alert')).toHaveText('Add an email or a WhatsApp number.');

  await form.getByLabel('or WhatsApp number').fill('06 12345678');
  await boxes.nth(0).check();
  await boxes.nth(1).check();
  await form.getByRole('button', { name: 'Save' }).click();
  await expect(form.getByRole('alert')).toContainText('only go by email');

  await boxes.nth(1).uncheck();
  await form.getByRole('button', { name: 'Save' }).click();
  await expect(form).toBeHidden();
});

test('notification preferences: each purpose switches on and off, and the change is saved', async ({ page }) => {
  await openSite(page);
  await fromAccountMenu(page, 'Notification preferences');
  await expect(page.getByText("There's no automatic mailing yet")).toBeVisible();
  const updates = page.getByRole('switch', { name: "Whether they go ahead, are cancelled or won't happen" });
  await expect(updates).toHaveAttribute('aria-checked', 'false');

  // Turning it on without a way to reach you asks for one first.
  await updates.click();
  const form = page.getByRole('dialog', { name: 'Hear whether it goes ahead' });
  await form.getByLabel('Email', { exact: true }).fill('robin@example.com');
  await form.getByRole('checkbox').first().check();
  await form.getByRole('checkbox').nth(1).check(); // launch news, by email
  await form.getByRole('button', { name: 'Save' }).click();
  await expect(form).toBeHidden();
  await expect(updates).toHaveAttribute('aria-checked', 'true');
  const launch = page.getByRole('switch', { name: 'When AgoraX launches' });
  await expect(launch).toHaveAttribute('aria-checked', 'true');

  await updates.click();
  await expect(updates).toHaveAttribute('aria-checked', 'false');
  await launch.click();
  await expect(launch).toHaveAttribute('aria-checked', 'false');
  await page.reload();
  await fromAccountMenu(page, 'Notification preferences');
  await expect(page.getByRole('switch', { name: "Whether they go ahead, are cancelled or won't happen" })).toHaveAttribute('aria-checked', 'false');
  await expect(page.getByRole('switch', { name: 'When AgoraX launches' })).toHaveAttribute('aria-checked', 'false');
});

test('the privacy notice is marked as a draft with its open points visible', async ({ page }) => {
  await openSite(page);
  await fromAccountMenu(page, 'Privacy notice');
  await expect(page.getByRole('note')).toContainText('Draft');
  await expect(page.locator('mark').first()).toContainText('To be confirmed');
  await expect(page.getByText('Autoriteit Persoonsgegevens', { exact: false })).toBeVisible();
});
