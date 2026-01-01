import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExperimentTemplate } from '@/entities/all';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

import { useExperimentDataLoading } from './useExperimentDataLoading';
import { useExperimentValidation } from './useExperimentValidation';
import { useExperimentFormHandlers } from './useExperimentFormHandlers';
import { usePresetJsonManagement } from './usePresetJsonManagement';

export function useExperimentForm() {
    const navigate = useNavigate();
    const { experiment, setExperiment, isLoading, isEditMode } = useExperimentDataLoading();
    const { errors, setErrors, validateForm } = useExperimentValidation();
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

    const handlers = useExperimentFormHandlers(experiment, setExperiment, navigate);
    const { presetTextValues, handlePresetValuesChange } = usePresetJsonManagement(experiment, handlers.handleNestedDynamicChange);

    const handleSubmit = useCallback(async (event) => {
        event.preventDefault();
        
        if (!validateForm(experiment)) {
            toast.error('יש לתקן את השגיאות בטופס');
            return;
        }

        setIsSaving(true);
        try {
            // וידוא שכל ערכי default, min, max, step הם strings
            const dataToSave = {
                ...experiment,
                parameters: experiment.parameters?.map(param => {
                    const converted = { ...param };
                    // המרה ל-string לכל הערכים המספריים
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

            // עדכון המצב ההתחלתי אחרי שמירה מוצלחת
            setInitialExperiment(JSON.parse(JSON.stringify(experiment)));
            setHasChanges(false);

            navigate(createPageUrl('AdminExperiments'));
        } catch (error) {
            console.error('Error saving experiment:', error);
            toast.error('אירעה שגיאה בשמירת הניסוי');
        } finally {
            setIsSaving(false);
        }
    }, [experiment, isEditMode, validateForm, navigate]);

    const exportExperiment = useCallback(() => {
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
        navigate,
        hasChanges,
        ...handlers,
        handlePresetValuesChange,
        handleSubmit,
        exportExperiment
    };
}