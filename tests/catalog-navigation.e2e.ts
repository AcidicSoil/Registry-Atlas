import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

test('browse components and open the real detail page', async ({ app, screen, browser }) => {
  await app.open();

  await screen.getByRole('link', 'Libraries').tap();

  await expect(browser).toHaveURL('/Registry-Atlas/registries');
  await expect(screen.getByRole('searchbox', 'Search catalog')).toBeVisible();

  await app.open('/Registry-Atlas/@logoforge/components/dotnet');

  await expect(screen.getByRole('heading', '.NET logo')).toBeVisible();
  await expect(screen.getByRole('button', '+ Add to setup')).toBeVisible();
});
