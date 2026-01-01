
import { useCallback } from 'react';

// Placeholder for validation logic. In a real application, this would be a more robust utility.
const validateExperiment = (experiment) => {
    const errors = [];

    if (!experiment.name || experiment.name.trim() === '') {
        errors.push('שם הניסוי לא יכול להיות ריק.');
    }

    if (!experiment.type || experiment.type.trim() === '') {
        errors.push('סוג הניסוי לא יכול להיות ריק.');
    }

    // Example: Check if all i18n titles are filled if they exist
    if (experiment.i18n_texts) {
        for (const locale in experiment.i18n_texts) {
            if (experiment.i18n_texts.hasOwnProperty(locale)) {
                const i18nText = experiment.i18n_texts[locale];
                if (i18nText && (!i18nText.title || i18nText.title.trim() === '')) {
                    errors.push(`שם הניסוי בשפה ${locale} לא יכול להיות ריק.`);
                }
            }
        }
    }

    // Add more validation rules as needed for other fields
    // e.g., parameters validation, unique names, etc.

    return {
        isValid: errors.length === 0,
        errors: errors
    };
};

// Placeholder for createPageUrl utility. In a real application, this would come from a router/routing config.
const createPageUrl = (routeName) => {
    switch (routeName) {
        case 'AdminExperiments':
            return '/admin/experiments';
        // Add other routes as needed
        default:
            return '/';
    }
};

export function useExperimentFormHandlers(
    experiment,
    setExperiment,
    presetTextValues, // Added from outline
    setPresetTextValues, // Added from outline
    navigate,
    base44, // Kept from original, implied by outline's handleSubmit usage
    toast // Kept from original, implied by outline's handleSubmit usage
) {
    const handleInputChange = useCallback((field, value) => {
        setExperiment(prev => ({ ...prev, [field]: value }));
    }, [setExperiment]);

    const handleI18nChange = useCallback((locale, field, value) => {
        setExperiment(prev => ({
            ...prev,
            i18n_texts: {
                ...prev.i18n_texts,
                [locale]: {
                    ...prev.i18n_texts?.[locale],
                    [field]: value
                }
            }
        }));
    }, [setExperiment]);

    const handleI18nStepsChange = useCallback((locale, index, value) => {
        setExperiment(prev => {
            const steps = [...(prev.i18n_texts?.[locale]?.steps || [])];
            steps[index] = value;
            return {
                ...prev,
                i18n_texts: {
                    ...prev.i18n_texts,
                    [locale]: {
                        ...prev.i18n_texts?.[locale],
                        steps
                    }
                }
            };
        });
    }, [setExperiment]);

    const addI18nStep = useCallback((locale) => {
        setExperiment(prev => ({
            ...prev,
            i18n_texts: {
                ...prev.i18n_texts,
                [locale]: {
                    ...prev.i18n_texts?.[locale],
                    steps: [...(prev.i18n_texts?.[locale]?.steps || []), '']
                }
            }
        }));
    }, [setExperiment]);

    const removeI18nStep = useCallback((locale, index) => {
        setExperiment(prev => {
            const steps = [...(prev.i18n_texts?.[locale]?.steps || [])];
            steps.splice(index, 1);
            return {
                ...prev,
                i18n_texts: {
                    ...prev.i18n_texts,
                    [locale]: {
                        ...prev.i18n_texts?.[locale],
                        steps
                    }
                }
            };
        });
    }, [setExperiment]);

    const handleDynamicArrayChange = useCallback((arrayName, index, field, value) => {
        setExperiment(prev => {
            const array = [...(prev[arrayName] || [])];
            array[index] = { ...array[index], [field]: value };
            return { ...prev, [arrayName]: array };
        });
    }, [setExperiment]);

    const handleNestedDynamicChange = useCallback((arrayName, index, nestedField, nestedIndex, field, value) => {
        setExperiment(prev => {
            const array = [...(prev[arrayName] || [])];
            const nestedArray = [...(array[index][nestedField] || [])];
            nestedArray[nestedIndex] = { ...nestedArray[nestedIndex], [field]: value };
            array[index] = { ...array[index], [nestedField]: nestedArray };
            return { ...prev, [arrayName]: array };
        });
    }, [setExperiment]);

    const addToArray = useCallback((arrayName, defaultItem) => {
        setExperiment(prev => ({
            ...prev,
            [arrayName]: [...(prev[arrayName] || []), defaultItem]
        }));
    }, [setExperiment]);

    const addNestedToArray = useCallback((arrayName, index, nestedField, defaultItem) => {
        setExperiment(prev => {
            const array = [...(prev[arrayName] || [])];
            array[index] = {
                ...array[index],
                [nestedField]: [...(array[index][nestedField] || []), defaultItem]
            };
            return { ...prev, [arrayName]: array };
        });
    }, [setExperiment]);

    const removeNestedFromArray = useCallback((arrayName, index, nestedField, nestedIndex) => {
        setExperiment(prev => {
            const array = [...(prev[arrayName] || [])];
            const nestedArray = [...(array[index][nestedField] || [])];
            nestedArray.splice(nestedIndex, 1);
            array[index] = { ...array[index], [nestedField]: nestedArray };
            return { ...prev, [arrayName]: array };
        });
    }, [setExperiment]);

    const removeFromArray = useCallback((arrayName, index) => {
        setExperiment(prev => {
            const array = [...(prev[arrayName] || [])];
            array.splice(index, 1);
            return { ...prev, [arrayName]: array };
        });
    }, [setExperiment]);

    const handleTagsChange = useCallback((value) => {
        const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag);
        setExperiment(prev => ({ ...prev, tags }));
    }, [setExperiment]);

    const handleOutputsChange = useCallback((value) => {
        const outputs = value.split(',').map(output => output.trim()).filter(output => output);
        setExperiment(prev => ({ ...prev, outputs }));
    }, [setExperiment]);

    const handleSubmit = async (e) => {
        e?.preventDefault(); // Changed from e.preventDefault() to e?.preventDefault() for robustness

        // Validation
        const validationResult = validateExperiment(experiment);
        if (!validationResult.isValid) {
            alert(`לא ניתן לשמור. שגיאות:\n${validationResult.errors.join('\n')}`);
            return;
        }

        try {
            // המרת ערכי default לstring לפני השמירה (this logic was already present and remains)
            const experimentToSave = {
                ...experiment,
                parameters: (experiment.parameters || []).map(param => ({
                    ...param,
                    default: param.default !== undefined && param.default !== null
                        ? String(param.default)
                        : ''
                }))
            };

            let savedExperiment;
            if (experiment.id) { // Changed condition from isEditMode to experiment.id
                savedExperiment = await base44.entities.ExperimentTemplate.update(experiment.id, experimentToSave);
                toast.success('הניסוי עודכן בהצלחה');
            } else {
                savedExperiment = await base44.entities.ExperimentTemplate.create(experimentToSave);
                toast.success('הניסוי נוצר בהצלחה');
            }

            navigate(createPageUrl('AdminExperiments')); // Updated navigation call
            return savedExperiment; // Added return of savedExperiment
        } catch (error) {
            console.error('Error saving experiment:', error);
            toast.error(`שגיאה בשמירת הניסוי: ${error.message}`); // Updated error message format
            throw error; // Added throw error
        }
    };

    return {
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
        handleSubmit
    };
}
