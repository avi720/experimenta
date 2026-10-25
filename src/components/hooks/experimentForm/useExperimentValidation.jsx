import { useState, useCallback } from 'react';

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FLOAT_REGEX = /^-?\d+(?:\.\d+)?$/;
const INT_REGEX = /^-?\d+$/;

function isValidNumericString(value, isInt = false) {
    if (value === '' || value === null || value === undefined) return false;
    const str = String(value).trim();
    if (!str) return false;
    if (isInt) {
        return INT_REGEX.test(str) && Number.isSafeInteger(Number(str));
    }
    return FLOAT_REGEX.test(str) && Number.isFinite(Number(str));
}

export function validateExperimentForm(
    experiment,
    { existingExperiments = [], presetTextValues = {} } = {}
) {
    const newErrors = {};
    if (!experiment) {
        newErrors.slug = 'שדה חובה';
        return newErrors;
    }

    const trimmedSlug = experiment.slug?.trim() || '';

    // 1. Slug format + uniqueness (T33)
    if (!trimmedSlug) {
        newErrors.slug = 'שדה חובה';
    } else if (!SLUG_REGEX.test(trimmedSlug)) {
        newErrors.slug = 'מזהה חייב להכיל אותיות קטנות באנגלית, מספרים ומקפים בלבד (לדוגמה: free-fall)';
    } else if (
        Array.isArray(existingExperiments) &&
        existingExperiments.some(
            (exp) =>
                exp &&
                exp.id !== experiment.id &&
                exp.slug?.trim().toLowerCase() === trimmedSlug.toLowerCase()
        )
    ) {
        newErrors.slug = 'מזהה ניסוי (Slug) זה כבר קיים במערכת';
    }

    // 2. Required localized content
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

    // 3. Parameters validation (T33)
    const seenParamKeys = new Set();
    const paramDefinitionsByKey = new Map();

    experiment.parameters?.forEach((param, index) => {
        const key = param.key?.trim() || '';
        if (!key) {
            newErrors[`param_${index}_key`] = 'שדה חובה';
        } else if (seenParamKeys.has(key)) {
            newErrors[`param_${index}_key`] = 'מפתח פרמטר כפול';
        } else {
            seenParamKeys.add(key);
            paramDefinitionsByKey.set(key, param);
        }

        if (param.type === 'float' || param.type === 'int') {
            const isInt = param.type === 'int';
            const typeErrorMsg = isInt ? 'יש להזין מספר שלם תקין' : 'ערך מספרי לא תקין';

            const hasValidDefault = isValidNumericString(param.default, isInt);
            if (param.default === '' || param.default === null || param.default === undefined) {
                newErrors[`param_${index}_default`] = 'שדה חובה';
            } else if (!hasValidDefault) {
                newErrors[`param_${index}_default`] = typeErrorMsg;
            }

            const hasMin = param.min !== '' && param.min !== null && param.min !== undefined;
            const hasMax = param.max !== '' && param.max !== null && param.max !== undefined;
            const hasStep = param.step !== '' && param.step !== null && param.step !== undefined;

            const isMinValid = !hasMin || isValidNumericString(param.min, isInt);
            const isMaxValid = !hasMax || isValidNumericString(param.max, isInt);
            const isStepValid = !hasStep || isValidNumericString(param.step, false);

            if (!isMinValid) {
                newErrors[`param_${index}_min`] = typeErrorMsg;
            }
            if (!isMaxValid) {
                newErrors[`param_${index}_max`] = typeErrorMsg;
            }
            if (!isStepValid) {
                newErrors[`param_${index}_step`] = 'ערך לא תקין';
            } else if (hasStep && Number(param.step) <= 0) {
                newErrors[`param_${index}_step`] = 'הצעד חייב להיות גדול מ-0';
            }

            const minVal = hasMin && isMinValid ? Number(param.min) : null;
            const maxVal = hasMax && isMaxValid ? Number(param.max) : null;

            if (minVal !== null && maxVal !== null && minVal >= maxVal) {
                newErrors[`param_${index}_max`] = 'המקסימום חייב להיות גדול מהמינימום';
            }

            if (hasValidDefault) {
                const defaultVal = Number(param.default);
                if (minVal !== null && defaultVal < minVal) {
                    newErrors[`param_${index}_default`] = `ערך ברירת המחדל חייב להיות לפחות ${minVal}`;
                } else if (maxVal !== null && defaultVal > maxVal) {
                    newErrors[`param_${index}_default`] = `ערך ברירת המחדל חייב להיות לכל היותר ${maxVal}`;
                }
            }
        }

        if (param.type === 'select') {
            const options = Array.isArray(param.options) ? param.options : [];
            const validOptionValues = options
                .map((opt) => opt?.value?.trim())
                .filter(Boolean);

            if (options.length === 0 || validOptionValues.length === 0) {
                newErrors[`param_${index}_options`] = 'יש להוסיף לפחות אפשרות אחת עם ערך';
            } else if (validOptionValues.length !== options.length) {
                newErrors[`param_${index}_options`] = 'לכל אפשרות בחירה חייב להיות ערך (Value)';
            }

            const defaultVal = param.default?.toString().trim() || '';
            if (!defaultVal || !validOptionValues.includes(defaultVal)) {
                newErrors[`param_${index}_default`] = 'ערך ברירת המחדל חייב להיות אחת מאפשרויות הבחירה';
            }
        }
    });

    // 4. Presets validation: JSON syntax + preset keys must match parameter keys (T33, T34)
    experiment.presets?.forEach((preset, index) => {
        const rawText =
            index in presetTextValues
                ? presetTextValues[index]
                : JSON.stringify(preset.values || {});

        let parsedValues = null;
        if (typeof rawText !== 'string' || !rawText.trim()) {
            newErrors[`preset_${index}_values`] = 'פורמט JSON לא תקין — יש להזין אובייקט JSON תקני';
            return;
        }

        try {
            const parsed = JSON.parse(rawText);
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
                newErrors[`preset_${index}_values`] = 'פורמט JSON לא תקין — יש להזין אובייקט JSON (למשל {"h0": 50})';
                return;
            }
            parsedValues = parsed;
        } catch {
            newErrors[`preset_${index}_values`] = 'פורמט JSON לא תקין — התבנית לא תישמר עד לתיקון';
            return;
        }

        const unknownKeys = Object.keys(parsedValues).filter(
            (k) => !paramDefinitionsByKey.has(k)
        );
        if (unknownKeys.length > 0) {
            newErrors[`preset_${index}_values`] = `מפתחות בתבנית אינם קיימים בפרמטרים: ${unknownKeys.join(', ')}`;
            return;
        }

        for (const [k, val] of Object.entries(parsedValues)) {
            const paramDef = paramDefinitionsByKey.get(k);
            if (paramDef && (paramDef.type === 'float' || paramDef.type === 'int')) {
                const isInt = paramDef.type === 'int';
                const numValid =
                    typeof val === 'number'
                        ? isInt
                            ? Number.isSafeInteger(val)
                            : Number.isFinite(val)
                        : isValidNumericString(val, isInt);
                if (!numValid) {
                    newErrors[`preset_${index}_values`] = `הערך של "${k}" בתבנית אינו תואם לסוג הפרמטר (${paramDef.type})`;
                    break;
                }
            } else if (paramDef && paramDef.type === 'select') {
                const allowed = (paramDef.options || []).map((o) => o?.value);
                if (!allowed.includes(String(val))) {
                    newErrors[`preset_${index}_values`] = `הערך של "${k}" בתבנית אינו קיים באפשרויות הבחירה`;
                    break;
                }
            }
        }
    });

    return newErrors;
}

export function useExperimentValidation() {
    const [errors, setErrors] = useState({});

    const validateForm = useCallback((experiment, context = {}) => {
        const newErrors = validateExperimentForm(experiment, context);
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, []);

    return {
        errors,
        setErrors,
        validateForm
    };
}
