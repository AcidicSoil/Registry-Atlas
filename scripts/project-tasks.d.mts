export interface ResolvedProjectTask {
  executable: string;
  args: string[];
}

/** Look up a single operation without executing it. */
export function resolveTask(
  group: string,
  operation: string,
  extraArgs?: string[],
): ResolvedProjectTask;

/** Look up an ordered task group without executing it. */
export function resolveWorkflow(group: string, operation?: string): string[] | null;
