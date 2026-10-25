import { test, expect } from '@playwright/test';
import { fromAccountMenu, goToList, openMenu, openSite, seed } from './helpers';

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

  await fromAccountMenu(page, 'Privacy notice');
  await expect(page.getByRole('heading', { name: 'Privacy notice' })).toBeVisible();
  await page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: 'Proposals' }).click();
  await expect(page.getByRole('button', { name: 'Creative', pressed: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Chess café' })).toHaveCount(0);
});

test('personal settings live in the profile card; the menu has no category filters', async ({ page }) => {
  await openSite(page);
  const menu = await openMenu(page);
  for (const item of ['Proposals', 'Scheduled events', 'My interests', 'Saved events', 'Report a bug', 'About the pilot']) {
    await expect(menu.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: item }).or(menu.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: item }))).toBeVisible();
  }
  for (const category of ['Sports', 'Creative', 'Outdoor']) await expect(menu.getByRole('button', { name: category, exact: true })).toHaveCount(0);
  await expect(menu.getByRole('button', { name: 'Notification preferences' })).toHaveCount(0);
  await menu.getByRole('button', { name: /Profile & settings/ }).click();
  for (const item of ['Profile', 'Attend, organise or both', 'Notification preferences', 'Privacy & my data', 'Account & security', 'Privacy notice']) {
    await expect(menu.getByRole('button', { name: item, exact: true })).toBeVisible();
  }
  await expect(page.getByRole('button', { name: 'Account and settings' })).toHaveCount(0);
});

test('organiser tools stay out of the menu until someone chooses to organise', async ({ page }, info) => {
  await openSite(page);
  const isPhone = info.project.name === 'phone';
  const openMenu = async () => {
    if (isPhone) await page.getByRole('button', { name: 'Open menu' }).click();
    return isPhone ? page.getByRole('dialog', { name: 'Menu' }) : page.locator('#site-menu-desktop');
  };
  let menu = await openMenu();
  await expect(menu.getByRole('heading', { name: 'Organiser tools' })).toHaveCount(0);
  await menu.getByRole('button', { name: 'Want to organise?' }).click();

  const dialog = page.getByRole('dialog', { name: 'How will you use AgoraX?' });
  await expect(dialog.getByText("they don't make you an AgoraX admin")).toBeVisible();
  await dialog.getByRole('radio', { name: /Both/ }).click();
  await expect(dialog).toBeHidden();

  menu = await openMenu();
  await expect(menu.getByRole('heading', { name: 'Organiser tools' })).toBeVisible();
  await expect(menu.getByRole('button', { name: 'New draft' })).toBeVisible();
  await expect(menu.getByRole('button', { name: 'Admin' })).toHaveCount(0);
});

test('footer links to privacy and help are on every screen', async ({ page }) => {
  await openSite(page);
  await goToList(page);
  const footer = page.getByRole('contentinfo');
  await expect(footer.getByRole('button', { name: 'Privacy Policy' })).toBeVisible();
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
