import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useExperimentForm } from '@/hooks/useExperimentForm';
import { useTranslation } from '@/i18n';

// Import UI components
import ExperimentFormHeaderActions from '../components/pagesComponents/admin/AdminExperimentForm/ExperimentFormHeaderActions';
import ExperimentFormProgressIndicator from '../components/pagesComponents/admin/AdminExperimentForm/ExperimentFormProgressIndicator';
import ExperimentFormFloatingSaveButton from '../components/pagesComponents/admin/AdminExperimentForm/ExperimentFormFloatingSaveButton';

// Import tab components
import GeneralSettingsTab from '../components/pagesComponents/admin/AdminExperimentForm/GeneralSettingsTab';
import ContentEditorTab from '../components/pagesComponents/admin/AdminExperimentForm/ContentEditorTab';
import ParametersEditorTab from '../components/pagesComponents/admin/AdminExperimentForm/ParametersEditorTab';
import PresetsEditorTab from '../components/pagesComponents/admin/AdminExperimentForm/PresetsEditorTab';
import AdvancedSettingsTab from '../components/pagesComponents/admin/AdminExperimentForm/AdvancedSettingsTab';

export default function AdminExperimentForm() {
  const { t, dir } = useTranslation();
  const {
    experiment,
    isLoading,
    isSaving,
    currentTab,
    setCurrentTab,
    errors,
    presetTextValues,
    isEditMode,
    notFound,
    navigate,
    hasChanges,
    handleInputChange,
    handleI18nChange,
    handleI18nStepsChange,
    addI18nStep,
    removeI18nStep,
    handleDynamicArrayChange,
    handleNestedDynamicChange,
    addToArray,
    addNestedToArray,
    removeNestedFromArray,
    removeFromArray,
    handleTagsChange,
    handleOutputsChange,
    handlePresetValuesChange,
    handleSubmit,
    exportExperiment
  } = useExperimentForm();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir={dir}>
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-slate-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (notFound || !experiment) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16" dir={dir}>
        <Card className="border-red-200 shadow-sm">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-slate-900">{t('admin.form.notFoundTitle')}</CardTitle>
            <CardDescription className="text-base text-slate-600">
              {t('admin.form.notFoundDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(createPageUrl('AdminExperiments'))}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
              {t('admin.form.backToList')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-6xl mx-auto px-4 py-8 space-y-8" dir={dir}>
      {/* Header and Actions */}
      <ExperimentFormHeaderActions
        isEditMode={isEditMode}
        experiment={experiment}
        exportExperiment={exportExperiment}
        navigate={navigate}
        isSaving={isSaving}
        hasChanges={hasChanges}
      />

      {/* Progress Indicator */}
      <ExperimentFormProgressIndicator currentTab={currentTab} />

      {/* Main Tabs */}
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-slate-100">
          <TabsTrigger value="general" className="data-[state=active]:bg-white">
            {t('admin.form.tabs.general')}
          </TabsTrigger>
          <TabsTrigger value="content" className="data-[state=active]:bg-white">
            {t('admin.form.tabs.content')}
          </TabsTrigger>
          <TabsTrigger value="parameters" className="data-[state=active]:bg-white">
            {t('admin.form.tabs.parameters')}
          </TabsTrigger>
          <TabsTrigger value="presets" className="data-[state=active]:bg-white">
            {t('admin.form.tabs.presets')}
          </TabsTrigger>
          <TabsTrigger value="advanced" className="data-[state=active]:bg-white">
            {t('admin.form.tabs.advanced')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralSettingsTab
            experiment={experiment}
            handleInputChange={handleInputChange}
            errors={errors}
          />
        </TabsContent>

        <TabsContent value="content">
          <ContentEditorTab
            experiment={experiment}
            handleI18nChange={handleI18nChange}
            handleI18nStepsChange={handleI18nStepsChange}
            addI18nStep={addI18nStep}
            removeI18nStep={removeI18nStep}
            errors={errors}
          />
        </TabsContent>

        <TabsContent value="parameters">
          <ParametersEditorTab
            experiment={experiment}
            handleDynamicArrayChange={handleDynamicArrayChange}
            handleNestedDynamicChange={handleNestedDynamicChange}
            addToArray={addToArray}
            addNestedToArray={addNestedToArray}
            removeNestedFromArray={removeNestedFromArray}
            removeFromArray={removeFromArray}
            errors={errors}
          />
        </TabsContent>

        <TabsContent value="presets">
          <PresetsEditorTab
            experiment={experiment}
            presetTextValues={presetTextValues}
            handlePresetValuesChange={handlePresetValuesChange}
            handleDynamicArrayChange={handleDynamicArrayChange}
            addToArray={addToArray}
            removeFromArray={removeFromArray}
            errors={errors}
          />
        </TabsContent>

        <TabsContent value="advanced">
          <AdvancedSettingsTab
            experiment={experiment}
            handleTagsChange={handleTagsChange}
            handleOutputsChange={handleOutputsChange}
            handleInputChange={handleInputChange}
          />
        </TabsContent>
      </Tabs>

      {/* Floating Save Button */}
      <ExperimentFormFloatingSaveButton
        isSaving={isSaving}
        hasChanges={hasChanges}
        isEditMode={isEditMode}
      />
    </form>
  );
}
