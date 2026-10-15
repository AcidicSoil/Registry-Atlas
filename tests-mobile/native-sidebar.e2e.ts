import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

test('mobile menu is native modal, dismissible, and preserves routes', async ({ app, screen, browser }) => {
  await app.open();

  const opener = screen.getByRole('button', 'Open navigation');

  await expect(opener).toBeVisible();
  await opener.tap();

  const modal = screen.getByRole('dialog', 'Registry Atlas navigation');

  await expect(modal).toBeVisible();
  await expect(opener).toHaveAttribute('aria-expanded', 'true');
  await expect.poll(() => browser.evaluate(() => {
    const dialog = document.getElementById('mobileSidebarDialog');

    return dialog instanceof HTMLDialogElement && dialog.open && dialog.matches(':modal');
  })).toBe(true);

  await app.screenshot('mobile-navigation-modal');
  await screen.getByRole('button', 'Close navigation').tap();
  await expect(modal).not.toBeVisible();
  await expect(opener).toHaveAttribute('aria-expanded', 'false');

  await opener.tap();
  await screen.getByRole('link', 'Libraries').tap();
  await expect(browser).toHaveURL('/Registry-Atlas/registries');
  await expect(modal).not.toBeVisible();
});
