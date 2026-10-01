import { initRegistryExplorer } from './ui';
import { loadRegistries } from './data/loadRegistries';

async function bootstrap() {
  try {
    const aside = document.getElementById('aside');
    const contentHeader = document.getElementById('contentHeader');
    const contentBody = document.getElementById('contentBody');
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    const tabs = document.querySelectorAll('.primary-nav [data-view]');
    const appSidebar = document.getElementById('appSidebar');
    const sidebarToggle = document.getElementById('sidebarToggle') as HTMLButtonElement | null;
    const sidebarClose = document.getElementById('sidebarClose') as HTMLButtonElement | null;
    const sidebarBackdrop = document.getElementById('sidebarBackdrop') as HTMLButtonElement | null;

    const setSidebarOpen = (open: boolean, restoreFocus = false) => {
      if (!appSidebar || !sidebarToggle || !sidebarBackdrop) return;
      appSidebar.dataset.open = String(open);
      sidebarToggle.setAttribute('aria-expanded', String(open));
      sidebarBackdrop.hidden = !open;
      if (open) sidebarClose?.focus();
      else if (restoreFocus) sidebarToggle.focus();
    };

    sidebarToggle?.addEventListener('click', () => setSidebarOpen(true));
    sidebarClose?.addEventListener('click', () => setSidebarOpen(false, true));
    sidebarBackdrop?.addEventListener('click', () => setSidebarOpen(false, true));
    appSidebar?.addEventListener('click', event => {
      const target = event.target as HTMLElement;
      if (target.closest('[data-view], [data-catalog-route], .brand-home-link')) {
        setSidebarOpen(false);
      }
    });
    window.addEventListener('keydown', event => {
      if (event.key === 'Escape' && appSidebar?.dataset.open === 'true') {
        setSidebarOpen(false, true);
      }
    });

    if (aside && contentHeader && contentBody && searchInput && tabs.length) {
      contentBody.innerHTML = `
        <div class="empty-state" role="status" aria-live="polite">
          <div class="empty-state-icon">...</div>
          <div>Loading catalog...</div>
        </div>
      `;

      const loadedData = await loadRegistries();

      initRegistryExplorer({
        registries: loadedData.registries,
        catalogIndex: loadedData.catalogIndex,
        mirrorMeta: loadedData.meta,
        mirrorWarnings: loadedData.warnings,
        roots: {
          aside,
          contentHeader,
          contentBody,
          tabs,
          searchInput,
        },
      });
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
