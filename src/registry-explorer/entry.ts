import { initRegistryExplorer } from './ui';
import { loadRegistries } from './data/loadRegistries';

// Wait for DOM
async function bootstrap() {
  try {
    const aside = document.getElementById('aside');
    const contentHeader = document.getElementById('contentHeader');
    const contentBody = document.getElementById('contentBody');
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    const tabs = document.querySelectorAll('.tab');

    if (aside && contentHeader && contentBody && searchInput && tabs.length) {
      contentBody.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">...</div>
          <div>Loading registry mirror...</div>
        </div>
      `;

      const loadedData = await loadRegistries();

      initRegistryExplorer({
        registries: loadedData.registries,
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
        <div class="empty-state">
          <div class="empty-state-icon">!</div>
          <div>Registry mirror data is unavailable.</div>
          <div>Run pnpm sync:registries and pnpm validate:data, then reload.</div>
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
