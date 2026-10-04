import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { SandpackLayout, SandpackPreview, SandpackProvider } from '@codesandbox/sandpack-react';

export interface LiveRegistryProject {
  schema: 'registry-atlas-sandpack/v1';
  namespace: string;
  slug: string;
  mode: 'upstream-demo' | 'generated-smoke-example';
  entryFile: string;
  files: Record<string, { code: string; hidden?: boolean; active?: boolean }>;
  dependencies: Record<string, string>;
  warning: string;
}

let mounted: Root | null = null;

export function mountRegistryProject(element: HTMLElement, project: LiveRegistryProject): void {
  if (project.schema !== 'registry-atlas-sandpack/v1'
    || !project.files['/App.tsx'] || !project.files['/index.tsx']
    || Object.keys(project.files).length > 75) throw Error('Invalid registry preview project');

  mounted?.unmount();
  mounted = createRoot(element);
  mounted.render(
    React.createElement(
      SandpackProvider,
      {
        template: 'react-ts',
        files: project.files,
        customSetup: { dependencies: project.dependencies },
        theme: 'light',
        options: { activeFile: '/App.tsx', autorun: true, initMode: 'immediate' },
      },
      React.createElement(
        SandpackLayout,
        null,
        React.createElement(SandpackPreview, {
          showNavigator: false,
          showOpenInCodeSandbox: false,
          showOpenNewtab: false,
          showSandpackErrorOverlay: true,
        }),
      ),
    ),
  );
}
