import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExperimentTemplate } from '@/entities/all';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import { useAppData } from './useAppData';

import { useExperimentDataLoading } from './experimentForm/useExperimentDataLoading';
import { useExperimentValidation, validateExperimentForm } from './experimentForm/useExperimentValidation';
import { useExperimentFormHandlers } from './experimentForm/useExperimentFormHandlers';
import { usePresetJsonManagement } from './experimentForm/usePresetJsonManagement';

function firstTabWithError(errorKeys) {
    if (errorKeys.includes('slug')) return 'general';
    if (errorKeys.some(k => k.startsWith('title_') || k.startsWith('short_desc_'))) return 'content';
    if (errorKeys.some(k => k.startsWith('param_'))) return 'parameters';
    if (errorKeys.some(k => k.startsWith('preset_'))) return 'presets';
    return null;
}

export function useExperimentForm() {
    const navigate = useNavigate();
    const { experiments: existingExperiments } = useAppData();
    const { experiment, setExperiment, isLoading, isEditMode, notFound } = useExperimentDataLoading();
    const { errors, setErrors } = useExperimentValidation();
    const [isSaving, setIsSaving] = useState(false);
    const [currentTab, setCurrentTab] = useState('general');

    // מעקב אחרי שינויים - שמירת המצב ההתחלתי
    const [initialExperiment, setInitialExperiment] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);

    // כאשר הניסוי נטען לראשונה, שומר את המצב ההתחלתי
    useEffect(() => {
        if (experiment && !initialExperiment && !isLoading) {
            setInitialExperiment(JSON.parse(JSON.stringify(experiment)));
        }
    }, [experiment, initialExperiment, isLoading]);

    // בודק אם יש שינויים בכל פעם שה-experiment משתנה
    useEffect(() => {
        if (initialExperiment && experiment) {
            const changed = JSON.stringify(experiment) !== JSON.stringify(initialExperiment);
            setHasChanges(changed);
        }
    }, [experiment, initialExperiment]);

    const handlers = useExperimentFormHandlers(experiment, setExperiment);
    const { presetTextValues, handlePresetValuesChange, handleRemovePresetText } = usePresetJsonManagement(
        experiment,
        handlers.handleNestedDynamicChange
    );

    const removeFromArray = useCallback((arrayName, index) => {
        if (arrayName === 'presets') {
            handleRemovePresetText(index);
        }
        handlers.removeFromArray(arrayName, index);
    }, [handlers, handleRemovePresetText]);

    // וידוא ששינויים ב-presetTextValues (כולל שגיאות עריכה ב-JSON) מאפשרים לחיצה על שמירה כדי להציג ולידציה
    const hasUnsavedPresetText =
        experiment?.presets?.some((preset, idx) => {
            if (!(idx in presetTextValues)) return false;
            return presetTextValues[idx] !== JSON.stringify(preset.values || {}, null, 2);
        }) ?? false;

    const handleSubmit = useCallback(async (event) => {
        event.preventDefault();
        if (!experiment || notFound) return;

        const validationErrors = validateExperimentForm(experiment, {
            existingExperiments,
            presetTextValues
        });
        setErrors(validationErrors);

        const errorKeys = Object.keys(validationErrors);
        if (errorKeys.length > 0) {
            const targetTab = firstTabWithError(errorKeys);
            if (targetTab) {
                setCurrentTab(targetTab);
            }
            toast.error('יש לתקן את השגיאות בטופס');
            return;
        }

        setIsSaving(true);
        try {
            const dataToSave = {
                ...experiment,
                slug: experiment.slug.trim(),
                parameters: experiment.parameters?.map(param => {
                    const converted = { ...param };
                    if (param.type === 'float' || param.type === 'int') {
                        converted.default = param.default !== undefined && param.default !== null && param.default !== ''
                            ? String(param.default)
                            : '';
                        converted.min = param.min !== undefined && param.min !== null && param.min !== ''
                            ? param.min
                            : null;
                        converted.max = param.max !== undefined && param.max !== null && param.max !== ''
                            ? param.max
                            : null;
                        converted.step = param.step !== undefined && param.step !== null && param.step !== ''
                            ? param.step
                            : null;
                    }
                    return converted;
                })
            };

            if (isEditMode && experiment.id) {
                await ExperimentTemplate.update(experiment.id, dataToSave);
                toast.success('הניסוי עודכן בהצלחה');
            } else {
                await ExperimentTemplate.create(dataToSave);
                toast.success('הניסוי נוצר בהצלחה');
            }

            setInitialExperiment(JSON.parse(JSON.stringify(experiment)));
            setHasChanges(false);

            navigate(createPageUrl('AdminExperiments'));
        } catch (error) {
            console.error('Error saving experiment:', error);
            if (error?.code === '23505' || String(error?.message || '').includes('experiment_templates_slug_key')) {
                setErrors(prev => ({
                    ...prev,
                    slug: 'מזהה ניסוי (Slug) זה כבר קיים במערכת'
                }));
                setCurrentTab('general');
                toast.error('מזהה הניסוי (Slug) כבר קיים במערכת');
            } else {
                toast.error('אירעה שגיאה בשמירת הניסוי');
            }
        } finally {
            setIsSaving(false);
        }
    }, [experiment, notFound, existingExperiments, presetTextValues, setErrors, isEditMode, navigate]);

    const exportExperiment = useCallback(() => {
        if (!experiment) return;
        const dataStr = JSON.stringify(experiment, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${experiment.slug || 'experiment'}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }, [experiment]);

    return {
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
        hasChanges: hasChanges || hasUnsavedPresetText,
        ...handlers,
        removeFromArray,
        handlePresetValuesChange,
        handleSubmit,
        exportExperiment
    };
}
