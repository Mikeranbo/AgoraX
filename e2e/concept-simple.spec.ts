import { test, expect } from '@playwright/test';
import { card, visitorUid } from './helpers';
import { makeOwner, seedRealEvents } from './seed-real';

/**
 * concept-simple, with the 40 real events: the page explains itself, lists the 12 shortlisted
 * events, and the full path works: ?src=test → I'd go → contact → price question → /admin.
 */
test.beforeEach(async () => {
  await seedRealEvents();
});

test('the page explains itself and shows only the shortlist, with plain answers and no dates or videos', async ({ page }) => {
  await page.goto('/?src=test');
  await expect(page.getByRole('heading', { name: "Pick the events you'd actually go to." })).toBeVisible();
  await expect(page.getByText('Nothing is paid now.')).toBeVisible();
  for (const step of ['Pick', 'We count', 'It happens']) await expect(page.getByText(step, { exact: true })).toBeVisible();
  await expect(page.getByText('Pilot', { exact: true }).first()).toBeVisible();
  await expect(page.locator('article')).toHaveCount(12);
  // Hidden by the concept flags: menu, account, location and date filters, the Scheduled switch.
  await expect(page.getByRole('button', { name: 'Open menu' })).toHaveCount(0);
  await expect(page.getByRole('combobox', { name: 'City' })).toHaveCount(0);
  await expect(page.getByRole('radio', { name: 'Scheduled' })).toHaveCount(0);
  await expect(page.getByText('Date to be confirmed')).toHaveCount(0);
  const tote = card(page, 'Tote-Bag Painting');
  await expect(tote.getByText('€5 = your bag and the fabric paint.')).toBeVisible();
  await expect(tote.getByText('What you bring:')).toBeVisible();
  await expect(card(page, 'Chess Challenge').getByText('Free', { exact: true })).toBeVisible();
  // "Help run this" is not on the cards.
  await expect(page.locator('article').getByText(/Organize|Help run this/)).toHaveCount(0);
  await expect(page.locator('video')).toHaveCount(0);
  // Navigation is Events and My picks only.
  const nav = page.getByRole('navigation', { name: 'Main' }).filter({ visible: true });
  await expect(nav.getByRole('button')).toHaveText([/Events/, /My picks/]);
});

test('full path: ?src=test, I\'d go, contact, price question once, and /admin shows the person', async ({ page }) => {
  await page.goto('/?src=test');
  await page.getByRole('region', { name: 'Visit statistics' }).getByRole('button', { name: 'No thanks' }).click();
  await card(page, 'Film Club (watch + talk)').getByRole('button', { name: "I'd go" }).click();

  const contact = page.getByRole('dialog', { name: 'Hear whether it goes ahead' });
  await expect(contact).toBeVisible();
  await contact.getByLabel('or WhatsApp number').fill('06 12345678');
  await contact.getByLabel("I'm 16 or older.").check();
  await contact.getByRole('checkbox', { name: /goes ahead, is cancelled/ }).check();
  await contact.getByRole('button', { name: 'Save' }).click();

  // Then the price question, about the price as shown (Free → €2).
  const ladder = page.getByRole('dialog', { name: 'One quick question' });
  await expect(ladder).toBeVisible();
  await expect(ladder.getByText('€2')).toBeVisible();
  await ladder.getByRole('button', { name: 'Yes' }).click();

  // A second pick asks nothing more.
  await card(page, 'Chess Challenge').getByRole('button', { name: "I'd go" }).click();
  await expect(card(page, 'Chess Challenge').getByText('Picked')).toBeVisible();
  await page.waitForTimeout(800);
  await expect(page.getByRole('dialog')).toHaveCount(0);

  // The owner sees the person, the source and both picks.
  await makeOwner(await visitorUid(page));
  await page.goto('/admin');
  const contacts = page.locator('section', { has: page.getByRole('heading', { name: 'Contact data' }) });
  await expect(contacts.getByText('0612345678').or(contacts.getByText('+31612345678')).first()).toBeVisible({ timeout: 20_000 });
  const row = contacts.locator('tr', { hasText: 'Film Club' });
  await expect(row).toContainText('Chess Challenge');
  await expect(row).toContainText('test');
});

test('"Tell us" in the footer: one short form for running, hosting or an idea', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('region', { name: 'Visit statistics' }).getByRole('button', { name: 'No thanks' }).click();
  await page.getByRole('contentinfo').getByRole('button', { name: 'Tell us' }).click();
  const form = page.getByRole('dialog', { name: 'Want to run or host something?' });
  await form.getByText('Host one at my place').click();
  await form.getByLabel('Where is it, and how many people fit?').fill('Common room in my student house, 20 people');
  await form.getByLabel('Email').fill('host@example.com');
  await form.getByLabel("I'm 16 or older.").check();
  await form.getByRole('checkbox', { name: /using your space/ }).check();
  await form.getByRole('button', { name: 'Send' }).click();
  await expect(form.getByText('Thanks. We read every message')).toBeVisible();
});

test('"Help run this" is on the event page, below the details', async ({ page }) => {
  await page.goto('/?e=board-game-discovery');
  await page.getByRole('region', { name: 'Visit statistics' }).getByRole('button', { name: 'No thanks' }).click();
  await expect(page.getByRole('heading', { name: 'In short' })).toBeVisible();
  const help = page.getByRole('heading', { name: 'Help run this' });
  await expect(help).toBeVisible();
  const details = await page.getByRole('heading', { name: 'Details' }).boundingBox();
  const helpBox = await help.boundingBox();
  expect(helpBox!.y).toBeGreaterThan(details!.y);
});
