const PANEL_STORAGE_KEY = 'registry-atlas.layout.sidebar-width.v1';

const DEFAULT_WIDTH = 240;

const MIN_WIDTH = 190;

const MAX_WIDTH = 440;

const STEP = 16;

export function clampPanelWidth(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_WIDTH;

  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.round(value)));
}

export function nextPanelWidth(width: number, key: string): number {
  if (key === 'Home') return MIN_WIDTH;

  if (key === 'End') return MAX_WIDTH;

  if (key === 'ArrowLeft') return clampPanelWidth(width - STEP);

  if (key === 'ArrowRight') return clampPanelWidth(width + STEP);

  return width;
}

export function setupAppShellPanels(): void {
  const main = document.getElementById('appMain');
  const handle = document.getElementById('appPanelResize');
  const navigation = document.getElementById('toggleSidebarPanel');
  const content = document.getElementById('toggleContentPanel');

  if (!(main instanceof HTMLElement) || !(handle instanceof HTMLElement)
    || !(navigation instanceof HTMLButtonElement) || !(content instanceof HTMLButtonElement)) return;

  const stored = window.localStorage?.getItem(PANEL_STORAGE_KEY);
  let width = clampPanelWidth(Number(stored || DEFAULT_WIDTH));
  let dragging = false;

  const setWidth = (value: number): void => {
    width = clampPanelWidth(value);
    main.style.setProperty('--sidebar-panel-width', width + 'px');
    handle.setAttribute('aria-valuenow', String(width));
    window.localStorage?.setItem(PANEL_STORAGE_KEY, String(width));
  };

  const setVisibility = (sidebarVisible: boolean, contentVisible: boolean): void => {
    main.dataset.sidebarCollapsed = String(!sidebarVisible);
    main.dataset.contentCollapsed = String(!contentVisible);
    navigation.setAttribute('aria-expanded', String(sidebarVisible));
    content.setAttribute('aria-expanded', String(contentVisible));
    navigation.setAttribute('aria-label', sidebarVisible ? 'Collapse navigation panel' : 'Expand navigation panel');
    content.setAttribute('aria-label', contentVisible ? 'Collapse content panel' : 'Expand content panel');
    handle.setAttribute('aria-disabled', String(!sidebarVisible || !contentVisible));
  };

  navigation.addEventListener('click', () => {
    const isVisible = main.dataset.sidebarCollapsed !== 'true';

    setVisibility(!isVisible, isVisible ? true : main.dataset.contentCollapsed !== 'true');
  });
  content.addEventListener('click', () => {
    const isVisible = main.dataset.contentCollapsed !== 'true';

    setVisibility(isVisible ? true : main.dataset.sidebarCollapsed !== 'true', !isVisible);
  });
  handle.addEventListener('keydown', event => {
    if (handle.getAttribute('aria-disabled') === 'true') return;

    const next = nextPanelWidth(width, event.key);

    if (next === width && event.key !== 'Home' && event.key !== 'End') return;

    event.preventDefault();
    setWidth(next);
  });
  handle.addEventListener('pointerdown', event => {
    if (handle.getAttribute('aria-disabled') === 'true' || event.button !== 0) return;

    dragging = true;
    handle.setPointerCapture(event.pointerId);
    event.preventDefault();
  });
  handle.addEventListener('pointermove', event => {
    if (!dragging) return;

    setWidth(event.clientX - main.getBoundingClientRect().left);
  });

  const stopDragging = (): void => {
    dragging = false;
  };

  handle.addEventListener('pointerup', stopDragging);
  handle.addEventListener('pointercancel', stopDragging);
  handle.addEventListener('lostpointercapture', stopDragging);

  setWidth(width);
  setVisibility(true, true);
}
