export interface ResolvedProjectTask {
  executable: string;
  args: string[];
}

/** Look up an existing maintenance command without invoking it. */
export function resolveTask(group: string, operation: string, extraArgs?: string[]): ResolvedProjectTask;
