import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

test('catalog appends results without pagination or losing earlier cards', async ({ app, browser }) => {
  await app.open('/Registry-Atlas/components');

  const count = () => browser.evaluate(() => document.querySelectorAll('.catalog-component-grid > .catalog-component-card').length);

  await expect.poll(count).toBeGreaterThan(0);

  const before = await count();

  await browser.evaluate(() => {
    document.querySelector<HTMLButtonElement>('[data-scroll-load-more]')?.click();

    return true;
  });

  await expect.poll(count).toBeGreaterThan(before);
  await expect.poll(() => browser.evaluate(() => {
    const meta = document.querySelector('.catalog-result-meta')?.textContent ?? '';

    return meta.startsWith('Showing 1–');
  })).toBe(true);

  const pagerCount = await browser.evaluate(() => document.querySelectorAll('.catalog-pagination, [data-discovery-page]').length);

  expect(pagerCount).toBe(0);
  await app.screenshot('incremental-components');
});

test('scrolling the registry directory automatically loads additional records', async ({ app, browser }) => {
  await app.open('/Registry-Atlas/registries');

  const count = () => browser.evaluate(() => document.querySelectorAll('.registry-directory-grid > *').length);

  await expect.poll(count).toBeGreaterThan(0);

  const before = await count();

  await browser.evaluate(() => {
    document.querySelector('[data-scroll-sentinel]')?.scrollIntoView();

    return true;
  });

  await expect.poll(count, { timeout: 20_000 }).toBeGreaterThan(before);
  await app.screenshot('incremental-registries');
});

test('back navigation restores previously appended catalog results', async ({ app, browser }) => {
  await app.open('/Registry-Atlas/components');

  const count = () => browser.evaluate(() => document.querySelectorAll('.catalog-component-grid > .catalog-component-card').length);

  await expect.poll(count).toBeGreaterThan(0);
  await browser.evaluate(() => {
    document.querySelector<HTMLButtonElement>('[data-scroll-load-more]')?.click();

    return true;
  });

  await expect.poll(count).toBeGreaterThan(32);
  const expandedCount = await count();

  await browser.evaluate(() => {
    document.querySelector<HTMLAnchorElement>('.catalog-component-grid .catalog-component-open')?.click();

    return true;
  });
  await expect.poll(() => browser.evaluate(() => location.pathname.includes('/components/') && location.pathname.includes('@'))).toBe(true);

  await browser.evaluate(() => {
    history.back();

    return true;
  });
  await expect.poll(() => browser.evaluate(() => location.pathname === '/Registry-Atlas/components')).toBe(true);
  await expect.poll(count).toBeGreaterThan(expandedCount - 1);
});
