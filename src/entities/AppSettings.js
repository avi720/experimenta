import { createEntity } from './createEntity';
import { appQueryKeys, queryClientInstance } from '@/lib/query-client';

export const AppSettings = createEntity('app_settings', {
  onChange: () => queryClientInstance.invalidateQueries({ queryKey: appQueryKeys.settings }),
});
