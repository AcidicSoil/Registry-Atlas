import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

test('catalog cards keep homepage, deeplink, source and clickable card without Inspect', async ({ app, browser, screen }) => {
  await app.open('/Registry-Atlas/components');
  await screen.getByRole('searchbox', 'Search catalog').fill('.NET logo');

  const homepage = screen.getByRole('link', 'Open registry homepage for @logoforge');
  const deeplink = screen.getByRole('link', 'View component');
  const cardLink = screen.getByRole('link', 'Open .NET logo from @logoforge');

  await expect(homepage).toBeVisible();
  await expect(homepage).toHaveAttribute('target', '_blank');
  await expect(homepage).toHaveAttribute('rel', 'noreferrer noopener');
  await expect(deeplink).toHaveAttribute('href', '/Registry-Atlas/@logoforge/components/dotnet');
  await expect(cardLink).toHaveAttribute('href', '/Registry-Atlas/@logoforge/components/dotnet');

  const placement = await browser.evaluate(() => {
    const card = document.querySelector('.catalog-component-card');
    const header = card?.querySelector('.catalog-component-card-heading');
    const homepageLink = card?.querySelector('.catalog-component-homepage');
    const footer = card?.querySelector('.catalog-component-source-actions');
    const deeplinkLink = card?.querySelector('.catalog-component-deeplink');
    const kind = card?.querySelector('.catalog-component-kind');
    const registry = card?.querySelector('.catalog-component-registry');
    const description = card?.querySelector('.catalog-component-description');

    if (!card || !header || !homepageLink || !footer || !deeplinkLink
      || !kind || !registry || !description) return null;

    const homepageBox = homepageLink.getBoundingClientRect();
    const footerBox = footer.getBoundingClientRect();
    const deeplinkBox = deeplinkLink.getBoundingClientRect();
    const kindBox = kind.getBoundingClientRect();
    const registryBox = registry.getBoundingClientRect();
    const descriptionBox = description.getBoundingClientRect();
    const source = card.querySelector<HTMLAnchorElement>('.catalog-component-original');

    const intersects = (a: DOMRect, b: DOMRect) =>
      a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

    return {
      homepageInCardHeader: homepageBox.top >= header.getBoundingClientRect().top
        && homepageBox.bottom < descriptionBox.top,
      homepageClearOfKind: !intersects(homepageBox, kindBox),
      homepageClearOfRegistry: !intersects(homepageBox, registryBox),
      homepageClearOfDescription: !intersects(homepageBox, descriptionBox),
      deeplinkInFooter: deeplinkBox.top >= footerBox.top - 2
        && deeplinkBox.right <= footerBox.right + 2,
      homepageIsIndependentAnchor: homepageLink.parentElement === card,
      noInspect: !card.querySelector('.catalog-component-inspect'),
      sourceValidIfPresent: !source || (source.target === '_blank' && source.rel === 'noreferrer noopener'),
    };
  });

  expect(placement).toEqual({
    homepageInCardHeader: true,
    homepageClearOfKind: true,
    homepageClearOfRegistry: true,
    homepageClearOfDescription: true,
    deeplinkInFooter: true,
    homepageIsIndependentAnchor: true,
    noInspect: true,
    sourceValidIfPresent: true,
  });
  await app.screenshot('card-registry-homepage-and-deeplink');

  await screen.getByRole('button', 'List').tap();

  const listLayout = await browser.evaluate(() => {
    const card = document.querySelector('.catalog-component-card');
    const homepageLink = card?.querySelector('.catalog-component-homepage');
    const kind = card?.querySelector('.catalog-component-kind');
    const description = card?.querySelector('.catalog-component-description');

    if (!card || !homepageLink || !kind || !description) return null;

    const homepageBox = homepageLink.getBoundingClientRect();
    const kindBox = kind.getBoundingClientRect();
    const textRange = document.createRange();
    textRange.selectNodeContents(description);

    const overlaps = (a: DOMRect, b: DOMRect) =>
      a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

    return {
      isList: Boolean(card.closest('.catalog-component-grid-list')),
      homepageClearOfKind: !overlaps(homepageBox, kindBox),
      homepageClearOfDescription: [...textRange.getClientRects()]
        .every(box => !overlaps(homepageBox, box)),
    };
  });

  expect(listLayout).toEqual({
    isList: true,
    homepageClearOfKind: true,
    homepageClearOfDescription: true,
  });
  await app.screenshot('card-actions-list-layout');

  await deeplink.tap();
  await expect(browser).toHaveURL('/Registry-Atlas/@logoforge/components/dotnet');
  await expect(screen.getByRole('heading', '.NET logo')).toBeVisible();

  await app.open('/Registry-Atlas/components/s/.NET%20logo');
  await screen.getByRole('link', 'Open .NET logo from @logoforge').tap();
  await expect(browser).toHaveURL('/Registry-Atlas/@logoforge/components/dotnet');
});
