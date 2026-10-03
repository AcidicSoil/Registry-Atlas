export type ReferenceScenario = 'filter-open' | 'sort-newest';
export interface ReferenceAction {
  ref: string;
  label: string;
  role: string;
}
export interface SnapshotNode {
  ref?: string;
  role?: string;
  name?: string;
}
export interface ReferenceState {
  url: string;
  filterGroups?: string[];
  tabs?: Array<{ label: string; selected: boolean }>;
}
export function selectReferenceAction(
  url: string,
  scenario: ReferenceScenario | string,
  snapshot: { nodes?: SnapshotNode[] },
): ReferenceAction | null;
export function assessReferenceTransition(
  scenario: ReferenceScenario | string,
  before: ReferenceState,
  after: ReferenceState,
): { status: 'interaction-verified' | 'unverified'; evidence?: unknown };
