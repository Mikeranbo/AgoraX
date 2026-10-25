import { expect, Page } from '@playwright/test';
// Plain JS, shared with the manual dev setup (node e2e/seed.mjs).
import seedData from './seed.mjs';

export const seed: () => Promise<void> = seedData;

/**
 * Opens the site as a brand-new anonymous visitor (each test has its own browser context) and
 * walks the entry flow: the opening messages, then "Got it — explore" on the pilot notice.
 */
export async function openSite(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /to explore/ })).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await page.getByRole('button', { name: 'Got it — explore' }).click();
  await expect(page.getByRole('dialog', { name: 'A quick note: this is a pilot' })).toBeHidden();
}

/** The card (an <article>) for an event title. */
export const card = (page: Page, title: string) => page.locator('article', { has: page.getByRole('heading', { name: title }) });

/** The list is the page itself now (the entry flow replaced the opening section). */
export async function goToList(page: Page) {
  await expect(page.getByRole('radio', { name: 'Proposals' })).toBeVisible();
  // The list is ready once the first card has rendered.
  await expect(page.locator('article').first()).toBeVisible();
}

/** The menu on either layout: the phone drawer, or the laptop sidebar (opened if hidden). */
export async function openMenu(page: Page) {
  const phone = (page.viewportSize()?.width ?? 1280) < 1024;
  if (phone) {
    await page.getByRole('button', { name: 'Open menu' }).click();
    return page.getByRole('dialog', { name: 'Menu' });
  }
  const sidebar = page.locator('#site-menu-desktop');
  if (!(await sidebar.isVisible())) await page.getByRole('button', { name: 'Open menu' }).click();
  return sidebar;
}

/** Opens a personal-settings screen from the profile card at the bottom of the menu. */
export async function fromAccountMenu(page: Page, item: string) {
  const menu = await openMenu(page);
  await menu.getByRole('button', { name: /Profile & settings/ }).click();
  await menu.getByRole('button', { name: item, exact: true }).click();
}

/** Opens a screen from the sidebar, on either layout. */
export async function fromSidebar(page: Page, item: string, isPhone: boolean) {
  if (isPhone) {
    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.getByRole('dialog', { name: 'Menu' }).getByRole('button', { name: item }).click();
  } else {
    await page.locator('#site-menu-desktop').getByRole('button', { name: item }).click();
  }
}
