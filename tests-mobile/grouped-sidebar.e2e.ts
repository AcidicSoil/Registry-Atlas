import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

test('mobile category selection reveals filtered results', async ({ app, browser, screen }) => {
  await app.open('/Registry-Atlas/components');

  await screen.getByRole('button', 'Open navigation').tap();

  const dialog = screen.getByRole('dialog', 'Registry Atlas navigation');
  const group = browser.locator('[data-sidebar-taxonomy-group="navigation"]');
  const summary = browser.locator('[data-sidebar-taxonomy-group="navigation"] > summary');
  const choice = browser.locator('[data-sidebar-taxonomy-group="navigation"] [data-catalog-canonical-value="navigation/navbar"]');

  await expect(dialog).toBeVisible();
  await summary.tap();
  await expect(group).toHaveAttribute('open', '');
  expect(await browser.evaluate(() => location.search)).toBe('');

  await choice.tap();
  await expect.poll(() => browser.evaluate(() => location.search.includes('navigation'))).toBe(true);
  await expect(dialog).not.toBeVisible();
  await expect(screen.getByRole('button', 'Open navigation')).toHaveAttribute('aria-expanded', 'false');
  await app.screenshot('mobile-canonical-filter');
});

test('native mobile navigation dismisses on Escape without filtering', async ({ app, screen, browser }) => {
  await app.open('/Registry-Atlas/components');
  await screen.getByRole('button', 'Open navigation').tap();

  const dialog = screen.getByRole('dialog', 'Registry Atlas navigation');

  await expect(dialog).toBeVisible();
  await dialog.press('Escape');
  await expect(dialog).not.toBeVisible();
  expect(await browser.evaluate(() => location.search)).toBe('');
  await expect(screen.getByRole('button', 'Open navigation')).toHaveAttribute('aria-expanded', 'false');
});
