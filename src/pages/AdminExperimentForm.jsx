import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useExperimentForm } from '../components/hooks/useExperimentForm';

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
  const {
    experiment,
    isLoading,
    isSaving,
    currentTab,
    setCurrentTab,
    errors,
    presetTextValues,
    isEditMode,
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-slate-600">טוען...</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-6xl mx-auto px-4 py-8 space-y-8" dir="rtl">
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
            פרטים כלליים
          </TabsTrigger>
          <TabsTrigger value="content" className="data-[state=active]:bg-white">
            תוכן
          </TabsTrigger>
          <TabsTrigger value="parameters" className="data-[state=active]:bg-white">
            פרמטרים
          </TabsTrigger>
          <TabsTrigger value="presets" className="data-[state=active]:bg-white">
            תבניות
          </TabsTrigger>
          <TabsTrigger value="advanced" className="data-[state=active]:bg-white">
            מתקדם
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
            errors={errors}
          />
        </TabsContent>
      </Tabs>

      {/* Floating Save Button */}
      <ExperimentFormFloatingSaveButton 
        isSaving={isSaving} 
        handleSubmit={handleSubmit}
        hasChanges={hasChanges}
        isEditMode={isEditMode}
      />
    </form>
  );
}