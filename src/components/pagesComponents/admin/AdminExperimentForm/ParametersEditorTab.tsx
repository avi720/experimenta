import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import ParameterInput from './ParameterInput/ParameterInput';
import { emptyParameter } from './adminFormConstants';
import { useTranslation } from '@/i18n';
import type { ExperimentFormHandlers } from '@/components/hooks/experimentForm/useExperimentFormHandlers';
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('admin.form.parameters.cardTitle')}</CardTitle>
        <CardDescription>{t('admin.form.parameters.cardDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {(experiment.parameters || []).map((param, index) => (
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
          className="w-full"
          onClick={() => addToArray('parameters', { ...emptyParameter })}
        >
          <PlusCircle className="me-2 h-5 w-5" />
          {t('admin.form.parameters.addParameter')}
        </Button>
      </CardContent>
    </Card>
  );
}
