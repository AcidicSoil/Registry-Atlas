export interface LocalRuntimeDataReport {
  catalogItems: number;
  itemDetails: number;
  documents: number;
  source: 'local';
}

export function checkRuntimeData(projectRoot?: string): Promise<LocalRuntimeDataReport>;
