import { createEntity } from './createEntity';
import { appQueryKeys, queryClientInstance } from '@/lib/query-client';

export const ExperimentTemplate = createEntity('experiment_templates', {
  // Keep the cached catalogue used by useAppData in sync after admin edits.
  onChange: () => queryClientInstance.invalidateQueries({ queryKey: appQueryKeys.experiments }),
});
