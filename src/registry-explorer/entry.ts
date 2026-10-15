import { initRegistryExplorer } from './ui';
import { loadRegistries } from './data/loadRegistries';
import { attachCatalogLinkPreviews } from './ui/catalogLinkPreview';
import { setupAppShellPanels } from './ui/appShellPanels';
import { setupRegistryProfilePanel } from './ui/registryProfilePanel';

function setupMobileSidebarControls(): void {
  const appSidebar = document.getElementById('appSidebar');
  const mobileDialog = document.getElementById('mobileSidebarDialog');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebarClose = document.getElementById('sidebarClose');
  const home = appSidebar?.parentElement;
  const nextSibling = appSidebar?.nextSibling;
  const mobileScreen = window.matchMedia('(max-width: 860px)');
  let returnFocus = false;

  if (!appSidebar || !(mobileDialog instanceof HTMLDialogElement)
    || !(sidebarToggle instanceof HTMLButtonElement) || !home) return;

  const restoreDesktopSidebar = (): void => {
    if (appSidebar.parentElement !== home) home.insertBefore(appSidebar, nextSibling ?? null);

    appSidebar.dataset.open = 'false';
    sidebarToggle.setAttribute('aria-expanded', 'false');
  };

  const close = (restoreFocus = true): void => {
    returnFocus = restoreFocus;

    if (mobileDialog.open) mobileDialog.close();
    else restoreDesktopSidebar();
  };

  const open = (): void => {
    if (!mobileScreen.matches || mobileDialog.open) return;

    mobileDialog.append(appSidebar);
    appSidebar.dataset.open = 'true';
    mobileDialog.showModal();
    sidebarToggle.setAttribute('aria-expanded', 'true');
    sidebarClose?.focus();
  };

  mobileDialog.addEventListener('close', () => {
    restoreDesktopSidebar();

    if (returnFocus) sidebarToggle.focus();

    returnFocus = false;
  });
  mobileDialog.addEventListener('cancel', () => {
    // Native Escape closes the modal and restores focus to its invoker.
    returnFocus = true;
  });
  mobileDialog.addEventListener('click', event => {
    if (event.target === mobileDialog) close();
  });
  appSidebar.addEventListener('click', event => {
    const target = event.target;

    if (target instanceof Element && target.closest('[data-view], [data-catalog-route], .brand-home-link')) close(false);
  });

  sidebarToggle.addEventListener('click', open);
  sidebarClose?.addEventListener('click', () => close());
  mobileScreen.addEventListener('change', event => {
    if (!event.matches && mobileDialog.open) close(false);
  });
}

async function bootstrap() {
  try {
    const aside = document.getElementById('aside');
    const contentHeader = document.getElementById('contentHeader');
    const contentBody = document.getElementById('contentBody');
    // SAFETY: The resolved DOM node is created as this control type in the page template; the handler only accesses its documented control members.
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    const sidebarContext = document.getElementById('sidebarContext');
    // SAFETY: This layout host is a required element in the HTML shell.
    const sidebarLayout = document.getElementById('sidebarLayout') as HTMLElement;
    // SAFETY: This collection label is a required element in the HTML shell.
    const sidebarCollectionCurrent = document.getElementById('sidebarCollectionCurrent') as HTMLElement;
    const setupCount = document.getElementById('setupCount');
    const tabs = document.querySelectorAll('.primary-nav [data-view]');
    setupMobileSidebarControls();
    setupAppShellPanels();

    if (aside && contentHeader && contentBody && searchInput && tabs.length) {
      contentBody.innerHTML = `
        <div class="empty-state" role="status" aria-live="polite">
          <div class="empty-state-icon">...</div>
          <div>Loading catalog...</div>
        </div>
      `;

      const loadedData = await loadRegistries();

      setupRegistryProfilePanel(contentBody);
      initRegistryExplorer({
        registries: loadedData.registries,
        catalogIndex: loadedData.catalogIndex,
        taxonomy: loadedData.taxonomy,
        mirrorMeta: loadedData.meta,
        mirrorWarnings: loadedData.warnings,
        roots: {
          aside,
          contentHeader,
          contentBody,
          tabs,
          searchInput,
          ...Object.fromEntries(sidebarContext ? [['sidebarContext', sidebarContext]] : []),
          sidebarLayout,
          sidebarCollectionCurrent,
          ...Object.fromEntries(setupCount ? [['setupCount', setupCount]] : []),
        },
      });

      attachCatalogLinkPreviews([contentBody, contentHeader]);
    } else {
      console.error('Registry Explorer: Missing DOM roots');
    }
  } catch (error) {
    console.error('Registry Explorer: Data load failed', error);
    const contentBody = document.getElementById('contentBody');

    if (contentBody) {
      contentBody.innerHTML = `
        <div class="empty-state" role="alert">
          <div class="empty-state-icon">!</div>
          <div>Catalog data is unavailable.</div>
          <div>Refresh after the registry data sync completes.</div>
        </div>
      `;
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
