import { test, expect } from '@playwright/test';
import { fromAccountMenu, goToList, openAccount, openMenu, openSite, seed } from './helpers';

test.beforeEach(async () => {
  await seed();
});

test('phone: the drawer slides in from the left and closes on Escape, an outside tap and a choice', async ({ page }, info) => {
  test.skip(info.project.name !== 'phone', 'phone layout');
  await openSite(page);
  const menuButton = page.getByRole('button', { name: 'Open menu' });
  const drawer = page.getByRole('dialog', { name: 'Menu' });

  await menuButton.click();
  await expect(drawer).toBeVisible();
  await expect.poll(async () => (await drawer.boundingBox())?.x).toBe(0);
  await expect(drawer.getByRole('button', { name: 'Close menu' })).toBeFocused();
  // The page behind is inert while the drawer is open.
  await expect(page.locator('main').locator('..')).toHaveAttribute('inert', '');

  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();
  await expect(menuButton).toBeFocused();

  await menuButton.click();
  await page.getByTestId('drawer-backdrop').click({ position: { x: 370, y: 420 } });
  await expect(drawer).toBeHidden();

  await menuButton.click();
  await drawer.getByRole('button', { name: 'Close menu' }).click();
  await expect(drawer).toBeHidden();

  await menuButton.click();
  await drawer.getByRole('button', { name: 'Saved events' }).click();
  await expect(drawer).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Saved events' })).toBeVisible();
});

test('laptop: the sidebar hides completely, the page widens, and the choice is remembered', async ({ page }, info) => {
  test.skip(info.project.name !== 'laptop', 'laptop layout');
  await openSite(page);
  const sidebar = page.locator('#site-menu-desktop');
  const content = page.locator('main').locator('..');
  const padding = () => content.evaluate((el) => getComputedStyle(el).paddingLeft);

  await expect(sidebar).toBeVisible();
  expect(await padding()).toBe('320px');
  await expect(page.getByRole('button', { name: 'Open menu' })).toBeHidden();

  await sidebar.getByRole('button', { name: 'Hide menu' }).click();
  await expect(sidebar).toBeHidden();
  expect(await padding()).toBe('0px');
  const menuButton = page.getByRole('button', { name: 'Open menu' });
  await expect(menuButton).toBeVisible();
  await expect(menuButton).toBeFocused();
  await expect(menuButton).toHaveAttribute('aria-expanded', 'false');

  // A reload in the same tab doesn't replay the entry flow.
  await page.reload();
  await expect(page.getByRole('radio', { name: 'Proposals' })).toBeVisible();
  await expect(sidebar).toBeHidden();

  await page.getByRole('button', { name: 'Open menu' }).click();
  await expect(sidebar).toBeVisible();
  await expect(sidebar.getByRole('button', { name: 'Hide menu' })).toBeFocused();
  expect(await padding()).toBe('320px');
});

test('phone: a category picked in the chips stays picked after visiting another screen', async ({ page }, info) => {
  test.skip(info.project.name !== 'phone', 'the bottom bar returns to the list without changing filters');
  await openSite(page);
  await page.getByRole('group', { name: 'Categories' }).getByRole('button', { name: 'Creative' }).click();
  await expect(page.getByRole('button', { name: 'Creative', pressed: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Chess café' })).toHaveCount(0);

  await fromAccountMenu(page, 'Privacy Policy');
  await expect(page.getByRole('heading', { name: 'AgoraX privacy notice' })).toBeVisible();
  await page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: 'Proposals' }).click();
  await expect(page.getByRole('button', { name: 'Creative', pressed: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Chess café' })).toHaveCount(0);
});

test('the menu holds only event items; settings, privacy and legal live on My account', async ({ page }) => {
  await openSite(page);
  const menu = await openMenu(page);
  const sections = menu.getByRole('navigation', { name: 'Sections' });
  for (const item of ['Proposals', 'Scheduled events', 'My interests', 'Saved events']) {
    await expect(sections.getByRole('button', { name: item })).toBeVisible();
  }
  for (const item of ['Propose an event', 'My proposals', 'I have a space']) await expect(menu.getByRole('button', { name: item })).toBeVisible();
  for (const category of ['Sports', 'Creative', 'Outdoor']) await expect(menu.getByRole('button', { name: category, exact: true })).toHaveCount(0);
  for (const item of ['Notification preferences', 'Privacy Policy', 'Terms of Use', 'Report a bug', 'About the pilot', 'FAQ']) {
    await expect(menu.getByRole('button', { name: item, exact: true }).or(menu.getByRole('link', { name: item, exact: true }))).toHaveCount(0);
  }

  await openAccount(page);
  const main = page.getByRole('main');
  for (const item of ['Attend, organise or both', 'Notification preferences', 'Privacy & my data', 'Account & security', 'Privacy Policy', 'Terms of Use', 'Cookie Policy', 'About the pilot', 'FAQ']) {
    await expect(main.getByRole('button', { name: item, exact: true })).toBeVisible();
  }
  await expect(main.getByRole('link', { name: 'Report a bug' })).toBeVisible();
  await expect(main.getByRole('link', { name: 'Admin' })).toHaveCount(0);
});

test('footer links to privacy and help are on every screen', async ({ page }) => {
  await openSite(page);
  await goToList(page);
  const footer = page.getByRole('contentinfo');
  await expect(footer.getByRole('button', { name: 'Privacy Policy' })).toBeVisible();
  await expect(footer.getByRole('button', { name: 'Privacy & my data' })).toBeVisible();
  await footer.getByRole('button', { name: 'How the pilot works' }).click();
  await expect(page.getByRole('heading', { name: 'How the pilot works' })).toBeVisible();
  await expect(page.getByRole('contentinfo').getByRole('button', { name: 'Privacy Policy' })).toBeVisible();
});

test('phone: with reduced motion the drawer still opens, takes focus and closes', async ({ page }, info) => {
  test.skip(info.project.name !== 'phone', 'phone layout');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openSite(page);
  await page.getByRole('button', { name: 'Open menu' }).click();
  const drawer = page.getByRole('dialog', { name: 'Menu' });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole('button', { name: 'Close menu' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();
});
