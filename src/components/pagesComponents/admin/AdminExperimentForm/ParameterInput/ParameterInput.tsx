import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Trash2 } from 'lucide-react';

import ParameterCommonFields from './ParameterCommonFields';
import NumericParameterFields from './NumericParameterFields';
import SelectParameterOptionsEditor from './SelectParameterOptionsEditor';
import BooleanParameterDefault from './BooleanParameterDefault';
import ParameterTranslationFields from './ParameterTranslationFields';
import { useTranslation } from '@/i18n';
import type { ExperimentFormHandlers } from '@/components/hooks/experimentForm/useExperimentFormHandlers';
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

  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {t('admin.form.parameters.paramCardTitle', { index: index + 1, name: paramName })}
          </CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeFromArray('parameters', index)}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Common Fields */}
        <ParameterCommonFields
          param={param}
          index={index}
          handleDynamicArrayChange={handleDynamicArrayChange}
          errors={errors}
        />

        <Separator />

        {/* Type-Specific Fields */}
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

        <Separator />

        {/* Translation Fields */}
        <ParameterTranslationFields
          param={param}
          index={index}
          handleNestedDynamicChange={handleNestedDynamicChange}
        />
      </CardContent>
    </Card>
  );
}
