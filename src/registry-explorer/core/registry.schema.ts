export type PrimaryFocus =
  | 'ai-chat'
  | 'support'
  | 'buttons-and-primitives'
  | 'dashboards-and-admin'
  | 'data-display-and-tables'
  | 'auth-and-user'
  | 'forms-and-inputs'
  | 'navigation'
  | 'templates-and-layouts'
  | 'marketing-sections'
  | 'ecommerce'
  | 'misc-utility';

export const PRIMARY_FOCUS_VALUES: readonly PrimaryFocus[] = [
  'ai-chat',
  'support',
  'buttons-and-primitives',
  'dashboards-and-admin',
  'data-display-and-tables',
  'auth-and-user',
  'forms-and-inputs',
  'navigation',
  'templates-and-layouts',
  'marketing-sections',
  'ecommerce',
  'misc-utility',
];

export type ComponentTag =
  | 'chatbot'
  | 'chat-window'
  | 'message-list'
  | 'typing-indicator'
  | 'prompt-box'
  | 'button'
  | 'input'
  | 'badge'
  | 'avatar'
  | 'toolbar'
  | 'icon-button'
  | 'loading-button'
  | 'toggle'
  | 'switch'
  | 'select'
  | 'textarea'
  | 'table'
  | 'data-grid'
  | 'filter-bar'
  | 'pagination'
  | 'chart'
  | 'stat-widget'
  | 'auth-form'
  | 'password-input'
  | 'stepper'
  | 'alert'
  | 'navbar'
  | 'sidebar'
  | 'breadcrumb'
  | 'app-shell'
  | 'tabs'
  | 'dropdown'
  | 'hero-section'
  | 'feature-grid'
  | 'testimonial'
  | 'cta-section'
  | 'card'
  | 'product-card'
  | 'price-badge'
  | 'cart-drawer'
  | 'mini-cart'
  | 'column-resize'
  | 'search-input'
  | 'tag-input'
  | 'checkbox'
  | 'radio'
  | 'datepicker'
  | 'submit-button'
  | 'error-message'
  | 'toast'
  | 'modal'
  | 'drawer'
  | 'skeleton'
  | 'spinner'
  | 'accordion'
  | 'calendar'
  | 'carousel'
  | 'collapsible'
  | 'combobox'
  | 'command'
  | 'context-menu'
  | 'hover-card'
  | 'menubar'
  | 'popover'
  | 'progress'
  | 'radio-group'
  | 'scroll-area'
  | 'separator'
  | 'sheet'
  | 'slider'
  | 'tooltip'
  | 'file-upload'
  | 'dropzone'
  | 'pricing-table'
  | 'timeline'
  | 'scroll-progress'
  | 'color-picker'
  | 'audio-player'
  | 'waveform'
  | 'voice-picker'
  | 'transcript-viewer';

export const COMPONENT_TAG_VALUES: readonly ComponentTag[] = [
  'chatbot',
  'chat-window',
  'message-list',
  'typing-indicator',
  'prompt-box',
  'button',
  'input',
  'badge',
  'avatar',
  'toolbar',
  'icon-button',
  'loading-button',
  'toggle',
  'switch',
  'select',
  'textarea',
  'table',
  'data-grid',
  'filter-bar',
  'pagination',
  'chart',
  'stat-widget',
  'auth-form',
  'password-input',
  'stepper',
  'alert',
  'navbar',
  'sidebar',
  'breadcrumb',
  'app-shell',
  'tabs',
  'dropdown',
  'hero-section',
  'feature-grid',
  'testimonial',
  'cta-section',
  'card',
  'product-card',
  'price-badge',
  'cart-drawer',
  'mini-cart',
  'column-resize',
  'search-input',
  'tag-input',
  'checkbox',
  'radio',
  'datepicker',
  'submit-button',
  'error-message',
  'toast',
  'modal',
  'drawer',
  'skeleton',
  'spinner',
  'accordion',
  'calendar',
  'carousel',
  'collapsible',
  'combobox',
  'command',
  'context-menu',
  'hover-card',
  'menubar',
  'popover',
  'progress',
  'radio-group',
  'scroll-area',
  'separator',
  'sheet',
  'slider',
  'tooltip',
  'file-upload',
  'dropzone',
  'pricing-table',
  'timeline',
  'scroll-progress',
  'color-picker',
  'audio-player',
  'waveform',
  'voice-picker',
  'transcript-viewer',
];

export interface Registry {
  name: string;
  url: string;
  description: string;
  primary_focus: PrimaryFocus[];
  component_tags: ComponentTag[];
  framework?: string;
  license?: string;
}

export interface FocusGroup {
  focusKey: PrimaryFocus;
  label: string;
  registries: Registry[];
  count: number;
}

export interface ComponentGroup {
  componentKey: ComponentTag;
  label: string;
  registries: Registry[];
  count: number;
}

export interface MatrixRow {
  registry: Registry;
  coverage: boolean[];
}

export interface RegistryExplorerMetrics {
  totalRegistries: number;
  visibleRegistries: number;
  focusGroupCount: number;
  componentTypeCount: number;
}