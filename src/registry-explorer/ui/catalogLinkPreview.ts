import { escapeHtml } from './renderSafety';

const PREVIEW_ID = 'catalog-link-preview';

const POINTER_DELAY_MS = 250;

/** Only verified upstream links attached by Atlas renderers qualify for previews. */
export function sourceLinkPreview(url: string): { src: string; hostname: string } | null {
  const parsed = parsePublicSourceUrl(url);

  if (!parsed) return null;

  const hostname = parsed.hostname.toLowerCase();
  const publishedAsset = publishedComponentAsset(parsed);

  if (publishedAsset) return { src: publishedAsset, hostname };

  // A supplied exact media URL is already the component asset; a documentation page is not.
  return /\.(?:svg|png|jpe?g|webp|avif|gif)$/i.test(parsed.pathname)
    ? { src: parsed.href, hostname }
    : null;
}

function publishedComponentAsset(page: URL): string | null {
  const host = page.hostname.toLowerCase();
  const path = page.pathname.replace(/\/$/, '');
  const match = (expression: RegExp) => expression.exec(path);

  if (host === 'logoforge.terravidhal.me') {
    const logo = match(/^\/logos\/([a-z0-9][a-z0-9-]*)$/);

    return logo ? `https://logoforge.terravidhal.me/logos/${logo[1]}/icon.svg` : null;
  }

  if (host === 'keylineicons.com') {
    const icon = match(/^\/icons\/([a-z0-9][a-z0-9-]*)$/);

    return icon ? `https://keylineicons.com/icons/${icon[1]}/opengraph-image/card` : null;
  }

  if (host === 'animateicons.in') {
    const icon = match(/^\/icons\/(huge|lucide)\/([a-z0-9][a-z0-9-]*)$/);

    return icon
      ? `https://animateicons.in/icons/${icon[1]}/${icon[2]}/opengraph-image`
      : null;
  }

  if (host === 'shadcnblocks.com') {
    const block = match(/^\/block\/([a-z0-9][a-z0-9-]*)$/);

    return block
      ? `https://cdn.shadcnblocks.com/shadcnblocks/screenshots/block/${block[1]}-4x3.webp`
      : null;
  }

  return null;
}

function parsePublicSourceUrl(url: string): URL | null {
  if (url.trim().startsWith('//')) return null;

  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.port) return null;

  const host = parsed.hostname.toLowerCase();

  if (isPrivateHostname(host)) return null;

  return parsed;
}

function isPrivateHostname(host: string): boolean {
  return !host.includes('.')
    || host.includes(':')
    || host === 'localhost'
    || host.endsWith('.local')
    || host.endsWith('.internal')
    || /^\d+(?:\.\d+){3}$/.test(host);
}

export function renderSourceLinkPreview(
  source: NonNullable<ReturnType<typeof sourceLinkPreview>>,
  title: string,
): string {
  return `<div class="catalog-link-preview-content">
    <div class="catalog-link-preview-visual">
      <img src="${escapeHtml(source.src)}" alt="${escapeHtml(title)} visual"
        decoding="async" referrerpolicy="no-referrer" />
    </div>
    <div class="catalog-link-preview-attribution">
      <span>Component preview</span>
      <span>${escapeHtml(source.hostname)}</span>
    </div>
  </div>`;
}

/** Link previews never change the original href, click handler, or native navigation. */
export function attachCatalogLinkPreviews(roots: readonly HTMLElement[]): void {
  let active: HTMLAnchorElement | null = null;
  let pending: number | undefined;
  let preview: HTMLElement | null = null;
  let previousDescription: string | null = null;

  function close(): void {
    window.clearTimeout(pending);
    pending = undefined;

    if (active) {
      if (previousDescription) active.setAttribute('aria-describedby', previousDescription);
      else active.removeAttribute('aria-describedby');
    }

    active = null;
    previousDescription = null;
    preview?.remove();
    preview = null;
  }

  function canPreview(): boolean {
    return window.innerWidth >= 640 && !window.matchMedia?.('(hover: none)').matches;
  }

  function previewFor(anchor: HTMLAnchorElement) {
    const sourceUrl = anchor.getAttribute('data-preview-source-url')
      || (anchor.matches('.catalog-component-original, .item-related-original') ? anchor.href : '');

    return sourceUrl ? sourceLinkPreview(sourceUrl) : null;
  }

  function show(anchor: HTMLAnchorElement, immediate = false): void {
    if (!anchor.isConnected || !canPreview()) return;

    const data = previewFor(anchor);

    if (!data) return;

    close();
    active = anchor;
    previousDescription = anchor.getAttribute('aria-describedby');

    const element = document.createElement('div');
    const card = anchor.closest('.catalog-component-card, .item-related-entry');

    const title = previewTitle(card, anchor);

    element.id = PREVIEW_ID;
    element.className = immediate ? 'catalog-link-preview catalog-link-preview-instant' : 'catalog-link-preview';
    element.setAttribute('role', 'tooltip');
    element.innerHTML = renderSourceLinkPreview(data, title);
    element.querySelector('img')?.addEventListener('error', close);

    document.body.append(element);
    preview = element;
    anchor.setAttribute('aria-describedby', [previousDescription, PREVIEW_ID].filter(Boolean).join(' '));
    position(anchor, element);
  }

  function previewTitle(card: Element | null, anchor: HTMLAnchorElement): string {
    return card?.querySelector('strong, .item-related-title')?.textContent?.trim()
      || anchor.getAttribute('aria-label') || 'Component';
  }

  function trigger(event: Event): HTMLAnchorElement | null {
    const target = event.target;

    if (!(target instanceof Element)) return null;

    return target.closest<HTMLAnchorElement>('a[href]');
  }

  function onPointerOver(event: PointerEvent): void {
    if (event.pointerType === 'touch' || !canPreview()) return;

    const anchor = trigger(event);

    if (!anchor || anchor === active) return;

    close();
    pending = window.setTimeout(() => show(anchor), POINTER_DELAY_MS);
  }

  function onPointerOut(event: PointerEvent): void {
    const anchor = trigger(event);

    if (!anchor) return;

    const next = event.relatedTarget;

    if (next instanceof Node && anchor.contains(next)) return;

    close();
  }

  function onFocusIn(event: FocusEvent): void {
    if (!canPreview()) return;

    const anchor = trigger(event);

    if (anchor) show(anchor, true);
  }

  function onFocusOut(event: FocusEvent): void {
    if (trigger(event)) close();
  }

  for (const root of roots) {
    root.addEventListener('pointerover', onPointerOver);
    root.addEventListener('pointerout', onPointerOut);
    root.addEventListener('focusin', onFocusIn);
    root.addEventListener('focusout', onFocusOut);
  }

  const observer = new MutationObserver(close);

  for (const root of roots) observer.observe(root, { childList: true });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') close();
  });

  document.addEventListener('scroll', close, true);
  window.addEventListener('resize', close);
}

function position(anchor: HTMLAnchorElement, element: HTMLElement): void {
  const rect = anchor.getBoundingClientRect();
  const width = element.getBoundingClientRect().width;
  const height = element.getBoundingClientRect().height;
  const margin = 12;

  const left = Math.max(margin, Math.min(rect.left, window.innerWidth - width - margin));

  const top = window.innerHeight - rect.bottom >= height + margin
    ? rect.bottom + margin : Math.max(margin, rect.top - height - margin);

  element.style.left = `${left}px`;
  element.style.top = `${top}px`;
}
