import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useExperimentForm } from '@/hooks/useExperimentForm';
import { useTranslation } from '@/i18n';
import { secondaryButtonClass } from '../components/pagesComponents/admin/adminStyles';

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
      <div className="min-h-screen bg-space flex items-center justify-center" dir={dir}>
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-line border-t-plasma"></div>
          <p className="text-dust">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (notFound || !experiment) {
    return (
      <div className="min-h-screen bg-space px-4 py-24" dir={dir}>
        <div className="mx-auto max-w-xl border-y border-line py-14 text-center">
          <div className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-full border border-danger/30 bg-danger/10">
            <AlertTriangle className="h-5 w-5 text-danger" />
          </div>
          <h1 className="text-[26px] font-light text-star">{t('admin.form.notFoundTitle')}</h1>
          <p className="mx-auto mt-3 max-w-[30rem] text-[15px] leading-relaxed text-dust">
            {t('admin.form.notFoundDescription')}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(createPageUrl('AdminExperiments'))}
            className={`${secondaryButtonClass} mt-8`}
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            {t('admin.form.backToList')}
          </Button>
        </div>
      </div>
    );
  }

  const tabTriggerClass =
    'focus-ring relative h-11 shrink-0 rounded-none border-b-2 border-transparent bg-transparent px-1 text-sm font-normal text-dust shadow-none transition-colors hover:text-star data-[state=active]:border-plasma data-[state=active]:bg-transparent data-[state=active]:text-star data-[state=active]:shadow-none';

  return (
    <form onSubmit={handleSubmit} className="min-h-screen bg-space text-star" dir={dir}>
      {/* Header and Actions */}
      <ExperimentFormHeaderActions
        isEditMode={isEditMode}
        experiment={experiment}
        exportExperiment={exportExperiment}
        navigate={navigate}
        isSaving={isSaving}
        hasChanges={hasChanges}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-32 space-y-8">
        {/* Progress Indicator */}
        <ExperimentFormProgressIndicator currentTab={currentTab} />

        {/* Main Tabs */}
        <Tabs dir={dir} value={currentTab} onValueChange={setCurrentTab} className="space-y-8">
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <TabsList className="flex h-auto w-max min-w-full justify-start gap-6 rounded-none border-b border-line bg-transparent p-0">
              <TabsTrigger value="general" className={tabTriggerClass}>
                {t('admin.form.tabs.general')}
              </TabsTrigger>
              <TabsTrigger value="content" className={tabTriggerClass}>
                {t('admin.form.tabs.content')}
              </TabsTrigger>
              <TabsTrigger value="parameters" className={tabTriggerClass}>
                {t('admin.form.tabs.parameters')}
              </TabsTrigger>
              <TabsTrigger value="presets" className={tabTriggerClass}>
                {t('admin.form.tabs.presets')}
              </TabsTrigger>
              <TabsTrigger value="advanced" className={tabTriggerClass}>
                {t('admin.form.tabs.advanced')}
              </TabsTrigger>
            </TabsList>
          </div>

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
      </div>

      {/* Floating Save Button */}
      <ExperimentFormFloatingSaveButton
        isSaving={isSaving}
        hasChanges={hasChanges}
        isEditMode={isEditMode}
      />
    </form>
  );
}
