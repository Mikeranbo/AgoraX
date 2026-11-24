import { expect, Locator, Page } from '@playwright/test';
// Plain JS, shared with the manual dev setup (node e2e/seed.mjs).
import seedData from './seed.mjs';

export const seed: () => Promise<void> = seedData;

/** Down arrow through the opening messages until the pilot notice opens (all three are shown first). */
export async function leaveIntro(page: Page) {
  const notice = page.getByRole('dialog', { name: 'A quick note: this is a pilot' });
  for (let i = 0; i < 3 && !(await notice.isVisible()); i++) await page.keyboard.press('ArrowDown');
  await expect(notice).toBeVisible();
}

/**
 * Opens the site as a brand-new anonymous visitor (each test has its own browser context) and
 * walks the entry flow: the opening messages, then "Got it — explore" on the pilot notice.
 */
export async function openSite(page: Page, { answerStats = true, path = '/' }: { answerStats?: boolean; path?: string } = {}) {
  await page.goto(path);
  const notice = page.getByRole('dialog', { name: 'A quick note: this is a pilot' });
  const intro = page.getByRole('button', { name: /to explore/ });
  // Retried as a whole: a cold dev server can reload the page once while it optimises dependencies.
  await expect(async () => {
    // A retry after the notice did close: already on the events page.
    // (Neither page has the opening screens any more: both open with the pilot notice.)
    if (!(await notice.isVisible()) && !(await intro.isVisible()) && ((await page.getByRole('radio', { name: 'Proposals' }).isVisible()) || (await page.locator('article').first().isVisible()) || (await page.getByRole('button', { name: 'Back to all proposals' }).isVisible()))) return;
    if (!(await notice.isVisible())) {
      await expect(intro).toBeVisible({ timeout: 5_000 });
      await leaveIntro(page);
    }
    await notice.getByRole('button', { name: 'Got it — explore' }).click({ timeout: 5_000 });
    await expect(notice).toBeHidden({ timeout: 5_000 });
  }).toPass({ timeout: 45_000 });
  // Then the statistics question; most tests just decline it.
  if (answerStats) {
    const stats = page.getByRole('region', { name: 'Visit statistics' });
    await stats.getByRole('button', { name: 'No thanks' }).click();
    await expect(stats).toBeHidden();
  }
}

/** The card (an <article>) for an event title. */
export const card = (page: Page, title: string) => page.locator('article', { has: page.getByRole('heading', { name: title }) });

/** The list is the page itself now (the entry flow replaced the opening section). */
export async function goToList(page: Page) {
  // (concept-simple has no Proposals / Scheduled switch.)
  await expect(page.getByRole('radio', { name: 'Proposals' }).or(page.locator('article')).first()).toBeVisible();
  // The list is ready once the first card has rendered.
  await expect(page.locator('article').first()).toBeVisible();
}

/** The menu on either layout: the phone drawer, or the laptop sidebar (opened if hidden). */
export async function openMenu(page: Page) {
  const phone = (page.viewportSize()?.width ?? 1280) < 1024;
  if (phone) {
    const drawer = page.getByRole('dialog', { name: 'Menu' });
    if (!(await drawer.isVisible())) await page.getByRole('button', { name: 'Open menu' }).click();
    return drawer;
  }
  const sidebar = page.locator('#site-menu-desktop');
  const button = page.getByRole('button', { name: 'Open menu' });
  // Wait for the page to render one or the other (right after a reload, neither is there yet).
  await expect(sidebar.or(button).first()).toBeVisible();
  if (await button.isVisible()) await button.click();
  return sidebar;
}

/** Opens My account from the button at the bottom of the menu. */
export async function openAccount(page: Page) {
  const menu = await openMenu(page);
  await menu.getByRole('button', { name: /My account/ }).click();
  await expect(page.getByRole('main').getByText('My account', { exact: true })).toBeVisible();
}

/** Opens a settings, privacy or help item on My account ("Profile" is My account itself). */
export async function fromAccountMenu(page: Page, item: string) {
  await openAccount(page);
  if (item === 'Profile') return;
  await page.getByRole('main').getByRole('button', { name: item, exact: true }).click();
}

/** Opens a screen from the menu, on either layout. */
export async function fromSidebar(page: Page, item: string) {
  const menu = await openMenu(page);
  await menu.getByRole('button', { name: item }).click();
}

/** The anonymous uid of the visitor in this page (Firebase keeps it in IndexedDB). */
export async function visitorUid(page: Page): Promise<string> {
  return page.evaluate(
    () =>
      new Promise<string>((resolve, reject) => {
        const req = indexedDB.open('firebaseLocalStorageDb');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const all = req.result.transaction('firebaseLocalStorage', 'readonly').objectStore('firebaseLocalStorage').getAll();
          all.onsuccess = () => resolve(all.result.map((r: { value?: { uid?: string } }) => r.value?.uid).find(Boolean) ?? '');
        };
      }),
  );
}
