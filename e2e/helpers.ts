import { expect, Page } from '@playwright/test';
// Plain JS, shared with the manual dev setup (node e2e/seed.mjs).
import seedData from './seed.mjs';

export const seed: () => Promise<void> = seedData;

/** Opens the site as a brand-new anonymous visitor (each test has its own browser context). */
export async function openSite(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Help choose which events happen next.' })).toBeVisible();
}

/** The card (an <article>) for an event title. */
export const card = (page: Page, title: string) => page.locator('article', { has: page.getByRole('heading', { name: title }) });

export async function goToList(page: Page) {
  await page.getByRole('button', { name: 'See the proposals' }).click();
  await expect(page.getByRole('radio', { name: 'Proposals' })).toBeVisible();
  // The list is ready once the first card has rendered.
  await expect(page.locator('article').first()).toBeVisible();
}

/** Opens a screen from the account menu (top right). */
export async function fromAccountMenu(page: Page, item: string) {
  await page.getByRole('button', { name: 'Account and settings' }).click();
  await page.getByRole('menuitem', { name: item }).click();
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
