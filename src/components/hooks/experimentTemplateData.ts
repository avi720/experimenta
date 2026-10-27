import type { ExperimentTemplateData } from '@/types/experiment';
import type { ExperimentTemplate } from '@/types/models';

/**
 * Types a template row's jsonb columns (`parameters`, `presets`, `i18n_texts`, `tags`, `outputs`)
 * with the shapes the app writes. No runtime normalisation: the row is returned as is.
 */
export function asTemplateData(row: ExperimentTemplate): ExperimentTemplateData {
  return row as unknown as ExperimentTemplateData;
}

export function asTemplateDataList(rows: readonly ExperimentTemplate[]): ExperimentTemplateData[] {
  return rows as unknown as ExperimentTemplateData[];
}
