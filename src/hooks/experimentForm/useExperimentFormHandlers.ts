import { useCallback, type Dispatch, type SetStateAction } from 'react';
import type { FormArrayName } from '@/types/admin';
import type { ExperimentFormData, Locale, LocalizedTexts } from '@/types/experiment';

// Array items are edited field by field with keys coming from the form inputs, so they are
// handled as plain records here; the form components decide which keys and values are valid.
type FormItem = Record<string, unknown>;

const asRecord = (value: unknown): FormItem => (value && typeof value === 'object' ? (value as FormItem) : {});
const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const itemsOf = (experiment: ExperimentFormData, arrayName: FormArrayName): FormItem[] => [...(experiment[arrayName] || [])];

const withItems = (experiment: ExperimentFormData, arrayName: FormArrayName, items: FormItem[]): ExperimentFormData =>
    ({ ...experiment, [arrayName]: items });

const withLocaleTexts = (experiment: ExperimentFormData, locale: Locale, patch: LocalizedTexts): ExperimentFormData => ({
    ...experiment,
    i18n_texts: {
        ...experiment.i18n_texts,
        [locale]: {
            ...experiment.i18n_texts?.[locale],
            ...patch
        }
    }
});

export function useExperimentFormHandlers(
    _experiment: ExperimentFormData | null,
    setExperiment: Dispatch<SetStateAction<ExperimentFormData | null>>
) {
    const handleInputChange = useCallback(<K extends keyof ExperimentFormData>(field: K, value: ExperimentFormData[K]) => {
        setExperiment(prev => prev && ({ ...prev, [field]: value }));
    }, [setExperiment]);

    const handleI18nChange = useCallback(<K extends keyof LocalizedTexts>(locale: Locale, field: K, value: LocalizedTexts[K]) => {
        setExperiment(prev => prev && withLocaleTexts(prev, locale, { [field]: value }));
    }, [setExperiment]);

    const handleI18nStepsChange = useCallback((locale: Locale, index: number, value: string) => {
        setExperiment(prev => {
            if (!prev) return prev;
            const steps = [...(prev.i18n_texts?.[locale]?.steps || [])];
            steps[index] = value;
            return withLocaleTexts(prev, locale, { steps });
        });
    }, [setExperiment]);

    const addI18nStep = useCallback((locale: Locale) => {
        setExperiment(prev => prev && withLocaleTexts(prev, locale, {
            steps: [...(prev.i18n_texts?.[locale]?.steps || []), '']
        }));
    }, [setExperiment]);

    const removeI18nStep = useCallback((locale: Locale, index: number) => {
        setExperiment(prev => {
            if (!prev) return prev;
            const steps = [...(prev.i18n_texts?.[locale]?.steps || [])];
            steps.splice(index, 1);
            return withLocaleTexts(prev, locale, { steps });
        });
    }, [setExperiment]);

    const handleDynamicArrayChange = useCallback((arrayName: FormArrayName, index: number, field: string, value: unknown) => {
        setExperiment(prev => {
            if (!prev) return prev;
            const array = itemsOf(prev, arrayName);
            array[index] = { ...array[index], [field]: value };
            return withItems(prev, arrayName, array);
        });
    }, [setExperiment]);

    const handleNestedDynamicChange = useCallback((
        arrayName: FormArrayName,
        index: number,
        nestedField: string,
        nestedIndex: number | null | undefined,
        field: string | null | undefined,
        value: unknown
    ) => {
        setExperiment(prev => {
            if (!prev) return prev;
            const array = itemsOf(prev, arrayName);
            const item = array[index] || {};

            if (nestedIndex === null || nestedIndex === undefined) {
                // Direct replacement of an object field (e.g. preset `values`) when `field` is also null,
                // or updating a single key on an object field (e.g. `i18n_labels.he`, `tooltip.en`).
                const updatedNested =
                    field === null || field === undefined
                        ? value
                        : { ...asRecord(item[nestedField]), [field]: value };
                array[index] = { ...item, [nestedField]: updatedNested };
            } else {
                const nestedArray = [...asArray(item[nestedField])];
                nestedArray[nestedIndex] = { ...asRecord(nestedArray[nestedIndex]), [String(field)]: value };
                array[index] = { ...item, [nestedField]: nestedArray };
            }

            return withItems(prev, arrayName, array);
        });
    }, [setExperiment]);

    const addToArray = useCallback((arrayName: FormArrayName, defaultItem: FormItem) => {
        setExperiment(prev => prev && withItems(prev, arrayName, [...itemsOf(prev, arrayName), defaultItem]));
    }, [setExperiment]);

    const addNestedToArray = useCallback((arrayName: FormArrayName, index: number, nestedField: string, defaultItem: unknown) => {
        setExperiment(prev => {
            if (!prev) return prev;
            const array = itemsOf(prev, arrayName);
            array[index] = {
                ...array[index],
                [nestedField]: [...asArray(array[index][nestedField]), defaultItem]
            };
            return withItems(prev, arrayName, array);
        });
    }, [setExperiment]);

    const removeNestedFromArray = useCallback((arrayName: FormArrayName, index: number, nestedField: string, nestedIndex: number) => {
        setExperiment(prev => {
            if (!prev) return prev;
            const array = itemsOf(prev, arrayName);
            const nestedArray = [...asArray(array[index][nestedField])];
            nestedArray.splice(nestedIndex, 1);
            array[index] = { ...array[index], [nestedField]: nestedArray };
            return withItems(prev, arrayName, array);
        });
    }, [setExperiment]);

    const removeFromArray = useCallback((arrayName: FormArrayName, index: number) => {
        setExperiment(prev => {
            if (!prev) return prev;
            const array = itemsOf(prev, arrayName);
            array.splice(index, 1);
            return withItems(prev, arrayName, array);
        });
    }, [setExperiment]);

    const handleTagsChange = useCallback((value: string) => {
        const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag);
        setExperiment(prev => prev && ({ ...prev, tags }));
    }, [setExperiment]);

    const handleOutputsChange = useCallback((value: string) => {
        const outputs = value.split(',').map(output => output.trim()).filter(output => output);
        setExperiment(prev => prev && ({ ...prev, outputs }));
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

export type ExperimentFormHandlers = ReturnType<typeof useExperimentFormHandlers>;
