const MIN = 200;

const MAX = 400;

const STEP = 16;

const DEFAULT = 280;

export function clampSummaryWidth(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT;

  return Math.min(MAX, Math.max(MIN, Math.round(value)));
}

export function resizeSummaryWidth(width: number, key: string): number {
  if (key === 'Home') return MIN;

  if (key === 'End') return MAX;

  if (key === 'ArrowLeft') return clampSummaryWidth(width - STEP);

  if (key === 'ArrowRight') return clampSummaryWidth(width + STEP);

  return width;
}

/** Owns panel actions across route renders, without listeners on replaced markup. */
export function setupRegistryProfilePanel(body: HTMLElement): void {
  const main = document.getElementById('appMain');

  if (!(main instanceof HTMLElement)) return;

  let width = DEFAULT;
  let dragging = false;

  const refreshControls = (): void => {
    const button = body.querySelector<HTMLButtonElement>('[data-profile-rail-toggle]');
    const resize = body.querySelector<HTMLElement>('[data-profile-rail-resize]');
    const expanded = main.dataset.profileSummaryCollapsed !== 'true';

    if (button) {
      button.setAttribute('aria-expanded', String(expanded));
      button.setAttribute('aria-label', expanded ? 'Collapse registry summary' : 'Expand registry summary');
    }

    if (resize) {
      resize.setAttribute('aria-valuenow', String(width));
      resize.setAttribute('aria-disabled', String(!expanded));
    }
  };

  const setWidth = (value: number): void => {
    width = clampSummaryWidth(value);
    main.style.setProperty('--registry-summary-width', width + 'px');
    refreshControls();
  };

  body.addEventListener('click', event => {
    if (!(event.target instanceof Element)) return;

    if (!event.target.closest('[data-profile-rail-toggle]')) return;

    main.dataset.profileSummaryCollapsed = String(main.dataset.profileSummaryCollapsed !== 'true');
    refreshControls();
  });

  body.addEventListener('keydown', event => {
    if (!(event.target instanceof Element) || !event.target.closest('[data-profile-rail-resize]')) return;

    if (main.dataset.profileSummaryCollapsed === 'true') return;

    const next = resizeSummaryWidth(width, event.key);

    if (next === width && event.key !== 'Home' && event.key !== 'End') return;

    event.preventDefault();
    setWidth(next);
  });

  body.addEventListener('pointerdown', event => {
    const handle = event.target instanceof Element ? event.target.closest('[data-profile-rail-resize]') : null;

    if (!(handle instanceof HTMLElement) || event.button !== 0 || main.dataset.profileSummaryCollapsed === 'true') return;

    dragging = true;
    handle.setPointerCapture(event.pointerId);
    event.preventDefault();
  });

  body.addEventListener('pointermove', event => {
    if (!dragging) return;

    const layout = body.querySelector('.registry-profile-layout');

    if (layout) setWidth(event.clientX - layout.getBoundingClientRect().left);
  });

  const stopDragging = (): void => {
    dragging = false;
  };

  body.addEventListener('pointerup', stopDragging);
  body.addEventListener('pointercancel', stopDragging);

  new MutationObserver(refreshControls).observe(body, { childList: true });
  refreshControls();
}
