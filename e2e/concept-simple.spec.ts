import { test, expect } from '@playwright/test';
import { card, visitorUid } from './helpers';
import { makeOwner, seedRealEvents } from './seed-real';

/**
 * Page A (concept-simple), with the 43 real events: the page explains itself, lists every event
 * page B lists at the same prices, and the full path works: ?src=test → I'd go → contact → price
 * question → /admin.
 */
test.beforeEach(async () => {
  await seedRealEvents();
});

test('the page explains itself and lists every event at its real price, with plain answers and no dates or videos', async ({ page }) => {
  await page.goto('/?src=test');
  await expect(page.getByRole('heading', { name: "Pick the events you'd actually go to." })).toBeVisible();
  await expect(page.getByText('Nothing is paid now.')).toBeVisible();
  for (const step of ['Pick', 'We count', 'It happens']) await expect(page.getByText(step, { exact: true })).toBeVisible();
  await expect(page.getByText('Pilot', { exact: true }).first()).toBeVisible();
  await expect(page.locator('article')).toHaveCount(43);
  // The same category chips as page B, Sports included, and the three tournaments.
  await expect(page.getByRole('group', { name: 'Categories' }).getByRole('button')).toHaveText([
    'All', 'Networking', 'Games', 'Sports', 'Creative', 'Social', 'Study', 'Tech & Ideas', 'Outdoor',
  ]);
  for (const t of ['Ping-Pong Tournament', 'Padel Tournament', 'Tennis Tournament']) await expect(card(page, t)).toBeAttached();
  await page.getByRole('group', { name: 'Categories' }).getByRole('button', { name: 'Sports' }).click();
  await expect(page.locator('article')).toHaveCount(3);
  await page.getByRole('group', { name: 'Categories' }).getByRole('button', { name: 'All' }).click();
  await expect(page.locator('article')).toHaveCount(43);
  // Hidden by the concept flags: menu, account, location and date filters, the Scheduled switch.
  await expect(page.getByRole('button', { name: 'Open menu' })).toHaveCount(0);
  await expect(page.getByRole('combobox', { name: 'City' })).toHaveCount(0);
  await expect(page.getByRole('radio', { name: 'Scheduled' })).toHaveCount(0);
  await expect(page.getByText('Date to be confirmed')).toHaveCount(0);
  const tote = card(page, 'Tote-Bag Painting');
  await expect(tote.getByText('€10: €5 for your bag and the fabric paint, the rest for the host who runs it.')).toBeVisible();
  await expect(tote.getByText('€10', { exact: true })).toBeVisible();
  await expect(tote.getByText('What you bring:')).toBeVisible();
  // Real prices: the seed price, as on page B. Only the free event says Free.
  await expect(card(page, 'Chess Challenge').getByText('€3', { exact: true })).toBeVisible();
  await expect(card(page, 'Reading Meetup').getByText('Free', { exact: true })).toBeVisible();
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

  // Then the price question, a step up from the price as shown (€3 → €4).
  const ladder = page.getByRole('dialog', { name: 'One quick question' });
  await expect(ladder).toBeVisible();
  await expect(ladder.getByText('€4')).toBeVisible();
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

  // …and the A/B numbers file it under page A (this test server always shows page A).
  const ab = page.locator('section', { has: page.getByRole('heading', { name: 'A/B test' }) });
  const picked = ab.locator('tr', { hasText: 'Picked at least one event' }).locator('td');
  await expect(picked.nth(1)).toHaveText(/^1 · /);
  await expect(picked.nth(2)).toHaveText(/^0 · /);
  await expect(ab.locator('tr', { hasText: 'Left a contact' }).locator('td').nth(1)).toHaveText(/^1 · /);
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

test('"Help run this" sits next to "I\'d go" on the opened event, with what a host keeps', async ({ page }) => {
  await page.goto('/?e=padel-tournament');
  await page.getByRole('region', { name: 'Visit statistics' }).getByRole('button', { name: 'No thanks' }).click();
  const signUp = page.getByRole('region', { name: 'Sign up' });
  const go = signUp.getByRole('button', { name: "I'd go" });
  const help = signUp.getByRole('button', { name: 'Help run this · keep ~€59' });
  await expect(go).toBeVisible();
  await expect(help).toBeVisible();
  await expect(signUp.getByText('The host keeps the ticket money after costs: an estimated €59 if 16 people come.')).toBeVisible();
  // Side by side: the two buttons share a row.
  const goBox = (await go.boundingBox())!;
  const helpBox = (await help.boundingBox())!;
  expect(Math.abs(goBox.y - helpBox.y)).toBeLessThan(8);
  expect(helpBox.x).toBeGreaterThan(goBox.x);
  // The old section below the details is gone.
  await expect(page.getByRole('heading', { name: 'Help run this' })).toHaveCount(0);
  // It opens the same host panel and form as before.
  await help.click();
  const panel = page.getByRole('dialog', { name: 'Organize this event' });
  await expect(panel.getByText('A host might keep', { exact: true })).toBeVisible();
  await panel.getByRole('button', { name: "I'd help run this" }).click();
  await expect(panel.getByLabel('First name')).toBeVisible();
});

test('a free event: only "Help run this", no money line', async ({ page }) => {
  await page.goto('/?e=reading-meetup');
  await page.getByRole('region', { name: 'Visit statistics' }).getByRole('button', { name: 'No thanks' }).click();
  const signUp = page.getByRole('region', { name: 'Sign up' });
  await expect(signUp.getByRole('button', { name: 'Help run this', exact: true })).toBeVisible();
  await expect(signUp.getByText(/keeps the ticket money/)).toHaveCount(0);
});
