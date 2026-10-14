import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

test('the .NET link shows the upstream SVG, not Registry Atlas chrome', async ({ app, screen, browser }) => {
  await app.open('/Registry-Atlas/components');

  await screen.getByRole('searchbox', 'Search catalog').fill('.NET logo');

  const link = screen.getByRole('link', 'Open source page on @logoforge');

  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href', 'https://logoforge.terravidhal.me/logos/dotnet');
  await link.hover();

  const preview = browser.locator('#catalog-link-preview img');

  await expect(preview).toBeVisible();
  await expect(preview).toHaveAttribute('src', 'https://logoforge.terravidhal.me/logos/dotnet/icon.svg');
  await expect.poll(() => browser.evaluate(() => {
    const image = document.querySelector<HTMLImageElement>('#catalog-link-preview img');

    return image?.naturalWidth ?? 0;
  }), { timeout: 15_000 }).toBeGreaterThan(0);

  await app.screenshot('dotnet-upstream-svg');

  await link.press('Escape');

  await expect(browser.locator('#catalog-link-preview')).toHaveCount(0);
});
