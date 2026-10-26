import { expect, Locator, Page } from '@playwright/test';
// Plain JS, shared with the manual dev setup (node e2e/seed.mjs).
import seedData from './seed.mjs';

export const seed: () => Promise<void> = seedData;

/**
 * Opens the site as a brand-new anonymous visitor (each test has its own browser context) and
 * walks the entry flow: the opening messages, then "Got it — explore" on the pilot notice.
 */
export async function openSite(page: Page) {
  await page.goto('/');
  const notice = page.getByRole('dialog', { name: 'A quick note: this is a pilot' });
  // Retried as a whole: a cold dev server can reload the page once while it optimises dependencies.
  await expect(async () => {
    if (!(await notice.isVisible())) {
      await expect(page.getByRole('button', { name: /to explore/ })).toBeVisible({ timeout: 5_000 });
      await page.keyboard.press('ArrowDown');
    }
    await notice.getByRole('button', { name: 'Got it — explore' }).click({ timeout: 5_000 });
    await expect(notice).toBeHidden({ timeout: 5_000 });
  }).toPass({ timeout: 45_000 });
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
  const button = page.getByRole('button', { name: 'Open menu' });
  // Wait for the page to render one or the other (right after a reload, neither is there yet).
  await expect(sidebar.or(button).first()).toBeVisible();
  if (await button.isVisible()) await button.click();
  return sidebar;
}

/** Opens a personal-settings screen from the profile card at the bottom of the menu. */
export async function fromAccountMenu(page: Page, item: string) {
  const menu = await openMenu(page);
  // The laptop sidebar stays open, so the card may still be expanded from a previous visit.
  const profileCard = menu.getByRole('button', { name: /Profile & settings/ });
  if ((await profileCard.getAttribute('aria-expanded')) !== 'true') await profileCard.click();
  await menu.getByRole('button', { name: item, exact: true }).click();
}

/** Expands the menu's collapsed "More" section, where the less used items live. */
export async function openMore(menu: Locator) {
  const more = menu.locator('details', { has: menu.page().locator('summary', { hasText: /^More$/ }) });
  if ((await more.getAttribute('open')) === null) await more.locator('summary').click();
}

/** Opens a screen from the menu (or its "More" section), on either layout. */
export async function fromSidebar(page: Page, item: string) {
  const menu = await openMenu(page);
  await openMore(menu);
  await menu.getByRole('button', { name: item }).click();
}
