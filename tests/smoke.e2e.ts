import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

test('Registry Atlas opens the catalog without a database connection', { tags: ['smoke'] }, async ({ app, screen }) => {
  await app.open();

  await expect(screen.getByRole('navigation', 'Catalog navigation')).toBeVisible();
  await expect(screen.getByRole('searchbox', 'Search catalog')).toBeVisible();
  await expect(screen.getByRole('link', 'Libraries')).toBeVisible();

  await app.screenshot('registry-atlas-home');
});
