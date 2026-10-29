import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

test('mobile card keeps registry homepage and deeplink independently accessible', async ({ app, browser, screen }) => {
  await app.open('/Registry-Atlas/components/s/.NET%20logo');

  const homepage = screen.getByRole('link', 'Open registry homepage for @logoforge');
  const deeplink = screen.getByRole('link', 'View component');

  await expect(homepage).toBeVisible();
  await expect(deeplink).toBeVisible();

  const geometry = await browser.evaluate(() => {
    const card = document.querySelector('.catalog-component-card');
    const homepageLink = card?.querySelector('.catalog-component-homepage');
    const registry = card?.querySelector('.catalog-component-registry');
    const kind = card?.querySelector('.catalog-component-kind');

    if (!card || !homepageLink || !registry || !kind) return null;

    const home = homepageLink.getBoundingClientRect();
    const kindBox = kind.getBoundingClientRect();
    const registryBox = registry.getBoundingClientRect();

    const overlap = (a: DOMRect, b: DOMRect) =>
      a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

    return {
      homepageClearOfType: !overlap(home, kindBox),
      homepageClearOfRegistry: !overlap(home, registryBox),
      homepageWithinViewport: home.right <= window.innerWidth,
      deeplinkWithinViewport: Boolean(card.querySelector('.catalog-component-deeplink'))
        && card.getBoundingClientRect().right <= window.innerWidth,
      noInspect: !card.querySelector('.catalog-component-inspect'),
    };
  });

  expect(geometry).toEqual({
    homepageClearOfType: true,
    homepageClearOfRegistry: true,
    homepageWithinViewport: true,
    deeplinkWithinViewport: true,
    noInspect: true,
  });

  await app.screenshot('mobile-card-homepage-and-deeplink');
  await deeplink.tap();
  await expect(browser).toHaveURL('/Registry-Atlas/@logoforge/components/dotnet');
});
