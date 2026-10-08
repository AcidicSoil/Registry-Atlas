export type CoverageStatus = 'verified' | 'inferred' | 'partial' | 'unavailable' | 'unverified';

export type CoverageConfidence = 'high' | 'medium' | 'low' | 'unknown';

export type ItemCatalogStatus = 'available' | 'partial' | 'unavailable' | 'unverified';

export interface RegistryItemSummaryFile {
  path: string;
  type: string;
  target?: string;
}

export interface RegistryItemSummary {
  name: string;
  slug: string;
  title?: string;
  description?: string;
  author?: string;
  type?: string;
  category?: string;
  source: string;
  provenance: string;
  catalogStatus: ItemCatalogStatus;
  confidence?: CoverageConfidence;
  routeEligible: boolean;
  installToken?: string;
  viewCommand?: string;
  installCommand?: string;
  rawItemUrl?: string;
  docsUrl?: string;
  evidenceUrl?: string;
  evidenceNote?: string;
  dependencies?: readonly string[];
  devDependencies?: readonly string[];
  registryDependencies?: readonly string[];
  files?: readonly RegistryItemSummaryFile[];
  warnings?: readonly string[];
}

export type RegistryThemeSwatch =
  | 'background'
  | 'foreground'
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'muted'
  | 'card';

export interface RegistryThemePreview {
  light?: Readonly<Partial<Record<RegistryThemeSwatch, string>>>;
  dark?: Readonly<Partial<Record<RegistryThemeSwatch, string>>>;
}

export type RegistryCssVars = Readonly<Partial<Record<
  'theme' | 'light' | 'dark',
  Readonly<Record<string, string>>
>>>;

export type CatalogCanonicalKind =
  | 'component'
  | 'block'
  | 'page'
  | 'template'
  | 'theme'
  | 'icon'
  | 'other';

export interface RegistryCatalogCanonical {
  taxonomyVersion: string;
  primary: string | null;
  path: readonly string[];
}

export interface RegistryCatalogAccess {
  normalized: 'free' | 'paid';
  sourceLabel: string;
}

export interface RegistryCatalogItem {
  name: string;
  type: string;
  rawItemUrl?: string;
  title?: string;
  description?: string;
  author?: string;
  categories?: readonly string[];
  kind?: CatalogCanonicalKind;
  canonical?: RegistryCatalogCanonical;
  sourceGroups?: readonly string[];
  access?: RegistryCatalogAccess;
  fileCount?: number;
  themePreview?: RegistryThemePreview;
}

export interface RegistryCatalogIndexMeta {
  source_url?: string;
  source?: string;
  synced_at?: string;
  generated_at?: string;
  registry_count: number;
  item_count: number;
}

/** A sitemap listing is discoverable but not independently page-verified. */
export interface RegistrySourcePage {
  url: string;
  level: 'reviewed' | 'sitemap' | 'pattern';
  source: 'reviewed-summary' | 'component-page-verified' | 'official-sitemap' | 'verified-route-pattern';
  observedAt?: string;
}

export interface RegistryCatalogIndex {
  meta: RegistryCatalogIndexMeta;
  registries: Readonly<Record<string, readonly RegistryCatalogItem[]>>;
  sourcePages?: Readonly<Record<string, RegistrySourcePage>>;
  itemRoutes?: Readonly<Record<string, {
    url: string;
    status: string;
  }>>;
  routePatterns?: Readonly<Record<string, readonly {
    urlTemplate: string;
    slugPrefix: string;
    source: string;
    checkedAt?: string;
  }[]>>;
}

export interface Registry {
  name: string;
  url: string;
  description: string;
  iconUrl?: string;
  framework?: string;
  license?: string;
  atlas?: {
    aliases: readonly string[];
    coverageStatus: CoverageStatus;
    confidence: CoverageConfidence;
    notes: string;
    catalogStatus: ItemCatalogStatus;
    comparisonEvidence?: 'catalog' | 'stale-catalog' | 'none';
    catalogItemCount?: number;
    catalogEvidenceUrl?: string;
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
