import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

test('add a component and review the non-payment setup', async ({ app, screen, browser }) => {
  await app.open('/Registry-Atlas/@logoforge/components/dotnet');

  await expect(screen.getByRole('heading', '.NET logo')).toBeVisible();
  await screen.getByRole('button', '+ Add to setup').tap();

  await screen.getByRole('link', 'View setup').tap();
  await expect(browser).toHaveURL('/Registry-Atlas/setup');

  await expect(screen.getByRole('button', 'Review setup')).toBeVisible();
  await expect(screen.getByRole('button', 'Remove .NET logo')).toBeVisible();

  await screen.getByRole('button', 'Review setup').tap();
  await expect(screen.getByRole('heading', 'Review setup')).toBeVisible();
  await expect(screen.getByRole('heading', 'Install command')).toBeVisible();
  await expect(screen.getByRole('heading', 'Coding-agent instructions')).toBeVisible();
  await expect(screen.getByRole('button', 'Copy command')).toBeVisible();

  const saved = await browser.evaluate(() => window.localStorage.getItem('registry-atlas.setup.v1'));

  expect(saved ?? '').toContain('@logoforge/dotnet');
  await app.screenshot('setup-review');
});
