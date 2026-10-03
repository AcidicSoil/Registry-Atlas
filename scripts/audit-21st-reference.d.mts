export interface ReferenceCandidateLink {
  text?: string;
  label?: string;
  href?: string;
  url?: string;
  count?: number;
  active?: boolean;
}
export interface ReferenceSidebarGroupInput {
  heading?: string;
  links?: readonly ReferenceCandidateLink[];
}
export interface ReferenceControlInput {
  kind?: string;
  label?: string;
  expanded?: boolean;
  selected?: boolean;
  disabled?: boolean;
}
export interface ReferencePageInput {
  url: string;
  title?: string;
  viewport?: { width?: number; height?: number };
  headings?: readonly string[];
  sidebarGroups?: readonly ReferenceSidebarGroupInput[];
  controls?: readonly ReferenceControlInput[];
  links?: readonly ReferenceCandidateLink[];
}
export interface ReferenceLink {
  label: string;
  url: string;
  count?: number;
  active?: boolean;
}
export interface ReferenceObservation {
  url: string;
  title: string;
  observedAt: string;
  viewport: { width: number; height: number };
  headings: string[];
  sidebarGroups: Array<{ heading: string; links: ReferenceLink[] }>;
  controls: Array<{kind: string;label: string;expanded?: boolean;selected?: boolean;disabled?: boolean}>;
  links: ReferenceLink[];
}
export interface ReferenceRoutePlan {
  queue: string[];
  selected: string[];
  pending: string[];
  deferred: string[];
  nextCursor: string | null;
  complete: boolean;
}
export function normalized21stUrl(raw: string, from?: string): string | null;
export function planReferenceRoutes(input: {
  queue?: readonly string[];
  observations?: Readonly<Record<string, {
    links?: readonly ReferenceCandidateLink[];
    sidebarGroups?: readonly ReferenceSidebarGroupInput[];
  }>>;
  errors?: Readonly<Record<string, { checkedAt?: string; message?: string }>>;
  maxRoutes?: number;
  nowMs?: number;
  retryDelayMs?: number;
  cursor?: string | null;
}): ReferenceRoutePlan;
export function summarizeReferencePage(
  raw: ReferencePageInput, expectedUrl: string, observedAt?: string,
): ReferenceObservation;
export function main(argv: string[]): Promise<{
  schema: string;
  dryRun?: boolean;
  output?: string;
  observed: number;
  pending: number;
  deferred: number;
  selected?: string[];
  processed?: Array<{ url: string; status: string; reason?: string; links?: number }>;
  errors?: number;
  nextCursor: string | null;
}>;
