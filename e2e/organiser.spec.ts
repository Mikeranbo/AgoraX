import { test, expect, Page } from '@playwright/test';
import { card, fromAccountMenu, fromSidebar, goToList, openAccount, openSite, seed, visitorUid } from './helpers';
import { approveOrganiser } from './seed.mjs';

test.beforeEach(async () => {
  await seed();
});

async function chooseMode(page: Page, mode: 'Attend' | 'Organise' | 'Both') {
  await fromAccountMenu(page, 'Attend, organise or both');
  await page.getByRole('dialog', { name: 'How will you use AgoraX?' }).getByRole('radio', { name: new RegExp(`^${mode}`) }).click();
}

async function openPropose(page: Page, isPhone: boolean) {
  if (isPhone) await page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: 'Propose' }).click();
  else await fromSidebar(page, 'Propose an event');
  await expect(page.getByRole('heading', { name: 'Propose an event' })).toBeVisible();
}

test('participants send proposals but get no draft tools', async ({ page }, info) => {
  await openSite(page);
  await openPropose(page, info.project.name === 'phone');
  await expect(page.getByRole('button', { name: 'Save as draft' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Send for review' })).toBeVisible();
});

test('organisers draft, preview, edit and send a proposal; it appears in My proposals', async ({ page }, info) => {
  const isPhone = info.project.name === 'phone';
  await openSite(page);
  await chooseMode(page, 'Organise');
  await openPropose(page, isPhone);

  await page.getByLabel('What is it? (required)').fill('Pottery night');
  await page.getByLabel('Category (required)').selectOption('Creative');
  await page.getByLabel('Rough price (€)').fill('12');
  await page.getByLabel('People it needs').fill('8');

  await page.getByRole('button', { name: 'Preview the card' }).click();
  const preview = page.getByRole('region', { name: 'Preview' });
  await expect(preview).toContainText('Pottery night');
  await expect(preview).toContainText('Date to be confirmed');
  await expect(preview).toContainText('0 of 8 needed to run');

  await page.getByRole('button', { name: 'Save as draft' }).click();
  await expect(page.getByRole('heading', { name: 'My proposals' })).toBeVisible();
  await expect(page.locator('section', { has: page.getByRole('heading', { name: 'Drafts' }) })).toContainText('Pottery night');

  await page.getByRole('button', { name: 'Edit, preview or send' }).click();
  await expect(page.getByRole('heading', { name: 'Edit draft' })).toBeVisible();
  await expect(page.getByLabel('What is it? (required)')).toHaveValue('Pottery night');

  // Sending needs a way to reach the organiser.
  await page.getByRole('button', { name: 'Send for review' }).click();
  await expect(page.getByRole('alert')).toHaveText('Add your first name.');
  await page.getByLabel('First name').fill('Robin');
  await page.getByLabel('Email', { exact: true }).fill('robin@example.com');
  await page.getByRole('checkbox', { name: /event you proposed/ }).check();
  await page.getByRole('button', { name: 'Send for review' }).click();
  await expect(page.getByRole('alert')).toHaveText("Tick that you're 16 or older. We can't keep contact details for anyone younger.");
  await page.getByLabel("I'm 16 or older.").check();
  await page.getByRole('button', { name: 'Send for review' }).click();
  await expect(page.getByText("still doesn't mean it will run")).toBeVisible();
  await page.getByRole('button', { name: 'See my proposals' }).click();
  const sent = page.locator('section', { has: page.getByRole('heading', { name: 'Sent for review' }) });
  await expect(sent).toContainText('Pottery night');
  await expect(page.locator('section', { has: page.getByRole('heading', { name: 'Drafts' }) })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Edit, preview or send' })).toHaveCount(0);
});

test('organisers can delete an unsent draft', async ({ page }, info) => {
  await openSite(page);
  await chooseMode(page, 'Both');
  await openPropose(page, info.project.name === 'phone');
  await page.getByLabel('What is it? (required)').fill('Throwaway idea');
  await page.getByLabel('Category (required)').selectOption('Games');
  await page.getByLabel('Rough price (€)').fill('3');
  await page.getByLabel('People it needs').fill('4');
  await page.getByRole('button', { name: 'Save as draft' }).click();
  await expect(page.getByText('Throwaway idea')).toBeVisible();
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByText('No proposals yet')).toBeVisible();
});

test('organiser account: apply, an admin approves, then the badge shows and own events go live', async ({ page }) => {
  await openSite(page);
  await openAccount(page);
  const main = page.getByRole('main');
  await expect(main.getByText('Participant', { exact: true })).toBeVisible();
  await main.getByRole('button', { name: 'Apply to organise' }).click();
  await main.getByLabel('What would you like to organise?').fill('Monthly board-game nights for first-years.');
  await main.getByRole('button', { name: 'Send application' }).click();
  await expect(main.getByText('Participant · organiser application sent')).toBeVisible();

  // An admin approves it (on /admin); the account updates by itself.
  await approveOrganiser(await visitorUid(page));
  await expect(main.getByText('Approved organiser').first()).toBeVisible();

  await main.getByRole('button', { name: 'Create an event' }).click();
  await expect(page.getByRole('heading', { name: 'Propose an event' })).toBeVisible();
  await page.getByLabel('What is it? (required)').fill('Dice night');
  await page.getByLabel('Category (required)').selectOption('Games');
  await page.getByLabel('Rough price (€)').fill('4');
  await page.getByLabel('People it needs').fill('6');
  await page.getByLabel('First name').fill('Robin');
  await page.getByLabel('Email', { exact: true }).fill('robin@example.com');
  await page.getByLabel("I'm 16 or older.").check();
  await page.getByRole('checkbox', { name: /event you proposed/ }).check();
  await page.getByRole('button', { name: 'Publish event' }).click();
  await expect(page.getByText('is live in the list as a proposal')).toBeVisible();

  await page.getByRole('button', { name: 'Back to proposals' }).click();
  await goToList(page);
  const dice = card(page, 'Dice night');
  await expect(dice).toBeVisible();
  await expect(dice.getByText('Approved organiser')).toBeVisible();
  await expect(dice.getByText('Date to be confirmed')).toBeVisible();
});
