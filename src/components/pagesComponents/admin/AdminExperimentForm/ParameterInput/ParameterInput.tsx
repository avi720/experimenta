import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

import ParameterCommonFields from './ParameterCommonFields';
import NumericParameterFields from './NumericParameterFields';
import SelectParameterOptionsEditor from './SelectParameterOptionsEditor';
import BooleanParameterDefault from './BooleanParameterDefault';
import ParameterTranslationFields from './ParameterTranslationFields';
import StatusPill from '../../StatusPill';
import { dangerIconButtonClass, panelClass } from '../../adminStyles';
import { useTranslation } from '@/i18n';
import type { ExperimentFormHandlers } from '@/hooks/experimentForm/useExperimentFormHandlers';
import type { FormErrors } from '@/types/admin';
import type { Parameter } from '@/types/experiment';

type ParameterInputProps = Pick<ExperimentFormHandlers,
  'handleDynamicArrayChange' | 'handleNestedDynamicChange' | 'addNestedToArray' | 'removeNestedFromArray' | 'removeFromArray'
> & {
  param: Parameter;
  index: number;
  errors: FormErrors;
};

export default function ParameterInput({
  param,
  index,
  handleDynamicArrayChange,
  handleNestedDynamicChange,
  addNestedToArray,
  removeNestedFromArray,
  removeFromArray,
  errors
}: ParameterInputProps) {
  const { t, pick } = useTranslation();
  const paramName = pick(param.i18n_labels) || param.key || `#${index + 1}`;
  const isActive = param.is_active !== false;

  return (
    <div className={`${panelClass} ${isActive ? '' : 'opacity-70'}`}>
      <div className="flex items-center gap-3 border-b border-line px-4 py-3 sm:px-5">
        <h3 className="min-w-0 flex-1 truncate text-[15px] font-medium text-star">
          {t('admin.form.parameters.paramCardTitle', { index: index + 1, name: paramName })}
        </h3>
        {param.key && (
          <span className="hidden font-mono text-xs text-blueshift sm:inline" dir="ltr">
            {param.key}{param.unit ? ` [${param.unit}]` : ''}
          </span>
        )}
        {!isActive && <StatusPill tone="warning" dot>{t('admin.list.inactiveStat')}</StatusPill>}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => removeFromArray('parameters', index)}
          className={dangerIconButtonClass}
          aria-label={`${t('admin.form.removeParameter')} ${index + 1}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-6 px-4 py-5 sm:px-5">
        {/* Common Fields */}
        <ParameterCommonFields
          param={param}
          index={index}
          handleDynamicArrayChange={handleDynamicArrayChange}
          errors={errors}
        />

        {/* Type-Specific Fields */}
        <div className="border-t border-line/70 pt-6">
          {(param.type === 'float' || param.type === 'int') && (
            <NumericParameterFields
              param={param}
              index={index}
              handleDynamicArrayChange={handleDynamicArrayChange}
              errors={errors}
            />
          )}

          {param.type === 'select' && (
            <SelectParameterOptionsEditor
              param={param}
              index={index}
              handleDynamicArrayChange={handleDynamicArrayChange}
              handleNestedDynamicChange={handleNestedDynamicChange}
              addNestedToArray={addNestedToArray}
              removeNestedFromArray={removeNestedFromArray}
              errors={errors}
            />
          )}

          {param.type === 'bool' && (
            <BooleanParameterDefault
              param={param}
              index={index}
              handleDynamicArrayChange={handleDynamicArrayChange}
            />
          )}
        </div>

        {/* Translation Fields */}
        <div className="border-t border-line/70 pt-6">
          <ParameterTranslationFields
            param={param}
            index={index}
            handleNestedDynamicChange={handleNestedDynamicChange}
          />
        </div>
      </div>
    </div>
  );
}
