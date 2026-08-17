import { loadRegistries } from './data/loadRegistries';
import { initAtlasRedesignPrototype } from './prototype/atlas-redesign.prototype';

type PrototypeVariant = 'A' | 'B' | 'C';

function readVariant(): PrototypeVariant {
  const value = new URLSearchParams(window.location.search).get('variant');
  return value === 'B' || value === 'C' ? value : 'A';
}

async function bootstrap() {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = '<div style="padding:24px;font:14px system-ui;color:#aab2c1;background:#090b10;min-height:100vh">Loading Registry Atlas prototype…</div>';

  try {
    const loadedData = await loadRegistries();
    initAtlasRedesignPrototype(loadedData.registries, readVariant());
  } catch (error) {
    console.error('Registry Atlas prototype: data load failed', error);
    app.innerHTML = '<div style="padding:24px;font:14px system-ui;color:#d6a8a8;background:#090b10;min-height:100vh">Registry mirror data is unavailable.</div>';
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  void bootstrap();
}
