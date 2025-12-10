import type { PrimaryFocus, ComponentTag } from './registry.schema';

export function focusLabel(focus: PrimaryFocus): string {
  const map: Record<PrimaryFocus, string> = {
    'ai-chat': 'AI & Chatbot',
    'support': 'Support UIs',
    'forms-and-inputs': 'Forms & Inputs',
    'buttons-and-primitives': 'Buttons & Primitives',
    'dashboards-and-admin': 'Dashboards & Admin',
    'marketing-sections': 'Marketing Sections',
    'ecommerce': 'Ecommerce',
    'auth-and-user': 'Auth & User',
    'data-display-and-tables': 'Data Display & Tables',
    'navigation': 'Navigation',
    'templates-and-layouts': 'Layouts & Templates',
    'misc-utility': 'Utility & Misc',
  };
  return map[focus] || focus;
}

export function componentLabel(tag: ComponentTag): string {
  // Replace hyphens with spaces
  return tag.replace(/-/g, ' ');
}
