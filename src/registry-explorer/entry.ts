import { initRegistryExplorer } from './ui';
import { registries } from './data/registries.data';

// Wait for DOM
function bootstrap() {
  try {
    const aside = document.getElementById('aside');
    const contentHeader = document.getElementById('contentHeader');
    const contentBody = document.getElementById('contentBody');
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    const tabs = document.querySelectorAll('.tab');

    if (aside && contentHeader && contentBody && searchInput && tabs.length) {
      initRegistryExplorer({
        registries,
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
    console.error('Registry Explorer: Initialization failed', error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
