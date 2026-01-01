import { useState, useCallback } from 'react';

export function useExperimentValidation() {
    const [errors, setErrors] = useState({});

    const validateForm = useCallback((experiment) => {
        const newErrors = {};

        // Basic validations
        if (!experiment.slug?.trim()) {
            newErrors.slug = 'שדה חובה';
        }
        if (!experiment.i18n_texts?.he?.title?.trim()) {
            newErrors.title_he = 'שדה חובה';
        }
        if (!experiment.i18n_texts?.en?.title?.trim()) {
            newErrors.title_en = 'שדה חובה';
        }
        if (!experiment.i18n_texts?.he?.short_desc?.trim()) {
            newErrors.short_desc_he = 'שדה חובה';
        }
        if (!experiment.i18n_texts?.en?.short_desc?.trim()) {
            newErrors.short_desc_en = 'שדה חובה';
        }

        // Parameters validation
        experiment.parameters?.forEach((param, index) => {
            if (!param.key?.trim()) {
                newErrors[`param_${index}_key`] = 'שדה חובה';
            }

            if (param.type === 'float' || param.type === 'int') {
                if (param.default === '' || param.default === null || param.default === undefined) {
                    newErrors[`param_${index}_default`] = 'שדה חובה';
                } else if (isNaN(parseFloat(param.default))) {
                    newErrors[`param_${index}_default`] = 'ערך לא תקין';
                }

                if (param.min !== '' && param.min !== null && param.min !== undefined && isNaN(parseFloat(param.min))) {
                    newErrors[`param_${index}_min`] = 'ערך לא תקין';
                }
                if (param.max !== '' && param.max !== null && param.max !== undefined && isNaN(parseFloat(param.max))) {
                    newErrors[`param_${index}_max`] = 'ערך לא תקין';
                }
                if (param.step !== '' && param.step !== null && param.step !== undefined && isNaN(parseFloat(param.step))) {
                    newErrors[`param_${index}_step`] = 'ערך לא תקין';
                }

                // Validate min < max
                const minVal = parseFloat(param.min);
                const maxVal = parseFloat(param.max);
                if (!isNaN(minVal) && !isNaN(maxVal) && minVal >= maxVal) {
                    newErrors[`param_${index}_max`] = 'המקסימום חייב להיות גדול מהמינימום';
                }
            }

            if (param.type === 'select' && (!param.options || param.options.length === 0)) {
                newErrors[`param_${index}_options`] = 'יש להוסיף לפחות אפשרות אחת';
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, []);

    return {
        errors,
        setErrors,
        validateForm
    };
}