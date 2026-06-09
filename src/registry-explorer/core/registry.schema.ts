export const PRIMARY_FOCUS_VALUES = [
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
] as const;

export type PrimaryFocus = (typeof PRIMARY_FOCUS_VALUES)[number];

export const COMPONENT_TAG_VALUES = [
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
  'dialog',
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
] as const;

export type ComponentTag = (typeof COMPONENT_TAG_VALUES)[number];

export type CoverageStatus = 'verified' | 'inferred' | 'partial' | 'unavailable' | 'unverified';

export type CoverageConfidence = 'high' | 'medium' | 'low' | 'unknown';

export type ItemCatalogStatus = 'available' | 'partial' | 'unavailable' | 'unverified';

export interface RegistryItemSummary {
  name: string;
  slug: string;
  type?: string;
  category?: string;
  source: string;
  provenance: string;
  catalogStatus: ItemCatalogStatus;
  routeEligible: boolean;
}

export interface Registry {
  name: string;
  url: string;
  description: string;
  primary_focus: PrimaryFocus[];
  component_tags: ComponentTag[];
  framework?: string;
  license?: string;
  atlas?: {
    aliases: readonly string[];
    coverageStatus: CoverageStatus;
    confidence: CoverageConfidence;
    notes: string;
    catalogStatus: ItemCatalogStatus;
  };
  mirror?: {
    officialName: string;
    registryUrlTemplate: string;
    sourceUrl: string;
    syncedAt: string;
    upstreamCount: number;
    localCount: number;
    warnings: string[];
  };
  itemSummaries?: readonly RegistryItemSummary[];
}

export type CoverageStatusCounts = Record<CoverageStatus, number>;

export interface FocusGroup {
  focusKey: PrimaryFocus;
  label: string;
  registries: Registry[];
  count: number;
  statusCounts: CoverageStatusCounts;
}

export interface ComponentGroup {
  componentKey: ComponentTag;
  label: string;
  registries: Registry[];
  count: number;
  statusCounts: CoverageStatusCounts;
}

export interface MatrixCell {
  componentKey: ComponentTag;
  matched: boolean;
  status: CoverageStatus | 'absent';
  label: string;
}

export interface MatrixRow {
  registry: Registry;
  coverage: boolean[];
  cells: MatrixCell[];
}

export interface RegistryExplorerMetrics {
  totalRegistries: number;
  visibleRegistries: number;
  focusGroupCount: number;
  componentTypeCount: number;
}

export type CandidateMatchField = 'item' | 'component-tag' | 'alias' | 'focus' | 'namespace' | 'description' | 'metadata';

export interface ComponentCandidate {
  id: string;
  registry: Registry;
  matchedLabel: string;
  matchedField: CandidateMatchField;
  itemName?: string;
  itemSlug?: string;
  itemType?: string;
  itemCategory?: string;
  itemSource?: string;
  itemProvenance?: string;
  catalogStatus: ItemCatalogStatus;
  routeEligible: boolean;
  route?: string;
  installAction: InstallActionState;
  matchReasons: string[];
  coverageStatus: CoverageStatus;
  coverageLabel: string;
  confidence: CoverageConfidence;
  score: number;
  warnings: readonly string[];
}

export interface DiscoveryOverview {
  totalRegistries: number;
  knownItemCount: number;
  routeEligibleItemCount: number;
  verifiedRegistryCount: number;
  unverifiedRegistryCount: number;
}

export type InstallActionStatus = 'enabled' | 'disabled';

export interface EnabledInstallActionState {
  status: 'enabled';
  token: string;
  installCommand: string;
  inspectCommand: string;
  route: string;
  disabledReason: null;
}

export interface DisabledInstallActionState {
  status: 'disabled';
  token: null;
  installCommand: null;
  inspectCommand: null;
  route: null;
  disabledReason: string;
}

export type InstallActionState = EnabledInstallActionState | DisabledInstallActionState;

export interface InstallQueueEntry {
  token: string;
  label: string;
  registry: string;
  item: string;
}

export interface BatchInstallCommandState {
  status: InstallActionStatus;
  command: string | null;
  disabledReason: string | null;
  tokens: readonly string[];
}

export interface RegistryProfileFact {
  label: string;
  value: string | number | readonly string[];
  url?: string;
}

export interface RegistryProfileItemRow {
  name: string;
  slug: string;
  type?: string;
  category?: string;
  catalogStatus: ItemCatalogStatus;
  source: string;
  provenance: string;
  routeEligible: boolean;
  route?: string;
  routeLabel: string;
  installAction: InstallActionState;
}

export interface RegistryProfileSection {
  name: 'Official shadcn facts' | 'Registry Atlas enrichment' | 'Item discovery status' | 'Why this matched';
  facts?: readonly RegistryProfileFact[];
  items?: readonly RegistryProfileItemRow[];
}

export interface RegistryProfile {
  registry: Registry;
  sections: readonly RegistryProfileSection[];
}
