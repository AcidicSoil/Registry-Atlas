export interface PnpmLockEntry {
  resolution?: { integrity?: string };
}

export interface PnpmLock {
  packages?: Record<string, PnpmLockEntry>;
}

export interface CycloneDxComponent {
  name: string;
  version: string;
  type: string;
  purl: string;
  hashes: Array<{ alg: string; content: string }>;
}

export interface CycloneDxSbom {
  bomFormat: 'CycloneDX';
  specVersion: '1.6';
  components: CycloneDxComponent[];
}

export function parsePackageKey(key: string): { name: string; version: string };
export function buildCycloneDxSbom(
  lock: PnpmLock, project: { name: string; version?: string },
): CycloneDxSbom;
