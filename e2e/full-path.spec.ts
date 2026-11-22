import { test, expect } from '@playwright/test';
import { card, goToList, openSite, seed, visitorUid } from './helpers';
import { makeOwner } from './seed-real';

/** The pilot's whole job in one go: a poster scan, a pick, a contact, and the owner sees it. */
test.beforeEach(async () => {
  await seed();
});

test('full path: ?src=test, pick an event, leave a contact, /admin shows the person', async ({ page }) => {
  await openSite(page, { path: '/?src=test' });
  await goToList(page);
  await card(page, 'Chess café').getByRole('button', { name: "I'm interested" }).click();
  // The first pick is followed by the price question; skip it, then the banner asks for a contact.
  await page.getByRole('button', { name: 'Skip' }).click();
  await page.getByRole('button', { name: 'Add it' }).click();
  const contact = page.getByRole('dialog', { name: 'Hear whether it goes ahead' });
  await contact.getByLabel('or WhatsApp number').fill('06 12345678');
  await contact.getByLabel("I'm 16 or older.").check();
  await contact.getByRole('checkbox', { name: /goes ahead, is cancelled/ }).check();
  await contact.getByRole('button', { name: 'Save' }).click();
  await expect(contact).toBeHidden();

  await makeOwner(await visitorUid(page));
  await page.goto('/admin');
  const contacts = page.locator('section', { has: page.getByRole('heading', { name: 'Contact data' }) });
  const row = contacts.locator('tr', { hasText: '+31612345678' });
  await expect(row).toBeVisible({ timeout: 20_000 });
  await expect(row).toContainText('Chess café');
  await expect(row).toContainText('test');
});
