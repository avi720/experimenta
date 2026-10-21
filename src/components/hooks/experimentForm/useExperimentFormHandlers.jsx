
import { useCallback } from 'react';

export function useExperimentFormHandlers(experiment, setExperiment) {
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
        handleOutputsChange
    };
}
