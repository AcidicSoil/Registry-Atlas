import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

test('desktop panels resize, collapse independently, and restore width', async ({ app, browser, screen }) => {
  await app.open('/Registry-Atlas/registries');

  const sidebar = browser.locator('#appSidebar');
  const separator = browser.locator('#appPanelResize');
  const navigationToggle = screen.getByRole('button', 'Collapse navigation panel');
  const contentToggle = screen.getByRole('button', 'Collapse content panel');

  await expect(separator).toBeVisible();
  await expect(sidebar).toBeVisible();
  await expect(separator).toHaveAttribute('aria-valuenow', '240');
  await separator.focus();
  await separator.press('ArrowRight');
  await expect(separator).toHaveAttribute('aria-valuenow', '256');

  const contentScrolls = await browser.evaluate(() => {
    const body = document.querySelector<HTMLElement>('#appContent .content-body');

    return !!body && getComputedStyle(body).overflowY === 'auto' && body.clientHeight > 0;
  });

  expect(contentScrolls).toBe(true);

  const scrollBoundaries = await browser.evaluate(() => ({
    overflow: getComputedStyle(document.documentElement).overflowY,
    bodyOverflow: getComputedStyle(document.body).overflowY,
    documentBodyHeight: document.body.scrollHeight,
    viewport: document.documentElement.clientHeight,
  }));

  expect(['hidden', 'clip']).toContain(scrollBoundaries.overflow);
  expect(['hidden', 'clip']).toContain(scrollBoundaries.bodyOverflow);
  expect(scrollBoundaries.documentBodyHeight).toBeLessThanOrEqual(scrollBoundaries.viewport);

  await navigationToggle.tap();
  await expect(screen.getByRole('button', 'Expand navigation panel')).toBeVisible();
  await expect(sidebar).not.toBeVisible();
  await screen.getByRole('button', 'Expand navigation panel').tap();
  await expect(sidebar).toBeVisible();

  await contentToggle.tap();
  await expect(browser.locator('#appContent')).not.toBeVisible();
  await screen.getByRole('button', 'Expand content panel').tap();
  await expect(browser.locator('#appContent')).toBeVisible();

  await app.screenshot('desktop-split-panels');

  await app.open('/Registry-Atlas/compare');
  await expect(separator).toHaveAttribute('aria-valuenow', '256');
});

test('logo navigation and favicons work from a non-home route', async ({ app, browser, screen }) => {
  await app.open('/Registry-Atlas/compare');

  await expect(screen.getByRole('link', 'Registry Atlas home')).toBeVisible();
  await screen.getByRole('link', 'Registry Atlas home').tap();
  await expect(browser).toHaveURL('/Registry-Atlas/');

  const result = await browser.evaluate(async () => {
    const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"][sizes="32x32"]');
    const response = icon ? await fetch(icon.href) : null;

    return {
      href: icon?.href ?? '',
      status: response?.status ?? 0,
      mime: response?.headers.get('content-type') ?? '',
      title: document.title,
    };
  });

  expect(new URL(result.href).pathname).toBe('/Registry-Atlas/registry-atlas/favicon-32x32.png');
  expect(result.status).toBe(200);
  expect(result.mime).toContain('image/png');
  expect(result.title).toBe('Registry Atlas');
});


test('nested sidebar disclosure navigates without changing the parent destination', async ({ app, browser, screen }) => {
  await app.open('/Registry-Atlas/registries');

  await screen.getByText('Collections', { exact: false }).tap();
  await expect(browser.locator('.sidebar-collections[open]')).toBeVisible();
  await screen.getByRole('link', 'Components').tap();
  await expect(browser).toHaveURL('/Registry-Atlas/components');
});

test('registry summary rail has independent resize, collapse and restore controls', async ({ app, browser, screen }) => {
  await app.open('/Registry-Atlas/@logoforge');

  const summary = browser.locator('#registryProfileSummary');
  const handle = browser.locator('[data-profile-rail-resize]');

  await expect(summary).toBeVisible();
  await expect(handle).toHaveAttribute('aria-valuenow', '280');
  await handle.focus();
  await handle.press('ArrowRight');
  await expect(handle).toHaveAttribute('aria-valuenow', '296');

  await screen.getByRole('button', 'Collapse registry summary').tap();
  await expect(summary).not.toBeVisible();
  await screen.getByRole('button', 'Expand registry summary').tap();
  await expect(summary).toBeVisible();

  await app.screenshot('registry-summary-resizable');
});
