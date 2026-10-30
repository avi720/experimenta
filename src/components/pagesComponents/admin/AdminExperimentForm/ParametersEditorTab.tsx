import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import ParameterInput from './ParameterInput/ParameterInput';
import FormSection from './FormSection';
import { createEmptyParameter } from './adminFormConstants';
import { secondaryButtonClass } from '../adminStyles';
import { useTranslation } from '@/i18n';
import type { ExperimentFormHandlers } from '@/hooks/experimentForm/useExperimentFormHandlers';
import type { FormErrors } from '@/types/admin';
import type { ExperimentFormData } from '@/types/experiment';

type ParametersEditorTabProps = Pick<
  ExperimentFormHandlers,
  'handleDynamicArrayChange' | 'handleNestedDynamicChange' | 'addToArray' | 'addNestedToArray' | 'removeNestedFromArray' | 'removeFromArray'
> & {
  experiment: ExperimentFormData;
  errors: FormErrors;
};

export default function ParametersEditorTab({
  experiment,
  handleDynamicArrayChange,
  handleNestedDynamicChange,
  addToArray,
  addNestedToArray,
  removeNestedFromArray,
  removeFromArray,
  errors
}: ParametersEditorTabProps) {
  const { t } = useTranslation();
  const parameters = experiment.parameters || [];

  return (
    <FormSection
      title={t('admin.form.parameters.cardTitle')}
      description={t('admin.form.parameters.cardDescription')}
      aside={<span className="font-mono text-sm tabular-nums text-dust">{parameters.length}</span>}
    >
      <div className="space-y-4">
        {parameters.map((param, index) => (
          <ParameterInput
            key={index}
            param={param}
            index={index}
            handleDynamicArrayChange={handleDynamicArrayChange}
            handleNestedDynamicChange={handleNestedDynamicChange}
            addNestedToArray={addNestedToArray}
            removeNestedFromArray={removeNestedFromArray}
            removeFromArray={removeFromArray}
            errors={errors}
          />
        ))}

        <Button
          type="button"
          variant="outline"
          className={`${secondaryButtonClass} h-12 w-full border-dashed`}
          onClick={() => addToArray('parameters', createEmptyParameter())}
        >
          <Plus className="h-4 w-4" />
          {t('admin.form.parameters.addParameter')}
        </Button>
      </div>
    </FormSection>
  );
}
