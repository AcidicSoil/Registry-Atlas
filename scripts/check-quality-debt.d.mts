export function newIssueCounts(
  current: Readonly<Record<string, number>>,
  baseline: Readonly<Record<string, number>>,
): Array<{ issue: string; added: number }>;
