/**
 * Single source of truth for runtime experiment parameter validation (T28).
 */

function parseOptionalBound(bound) {
    if (bound === undefined || bound === null || String(bound).trim() === "") {
        return undefined;
    }
    const parsed = parseFloat(bound);
    return Number.isNaN(parsed) ? undefined : parsed;
}

export function validateParameterValue(parameter, value, isRTL = true) {
    if (!parameter || !parameter.key || parameter.is_active === false) {
        return { isValid: true, error: null };
    }

    if (parameter.type === "float" || parameter.type === "int") {
        if (value === undefined || value === null || String(value).trim() === "") {
            return {
                isValid: false,
                error: isRTL ? "שדה זה הוא חובה" : "This field is required",
            };
        }

        const numValue = typeof value === "number" ? value : Number(String(value).trim());
        if (Number.isNaN(numValue) || !Number.isFinite(numValue)) {
            return {
                isValid: false,
                error: isRTL ? "יש להזין מספר חוקי" : "Please enter a valid number",
            };
        }

        if (parameter.type === "int" && !Number.isInteger(numValue)) {
            return {
                isValid: false,
                error: isRTL ? "יש להזין מספר שלם" : "Please enter a whole number",
            };
        }

        const min = parseOptionalBound(parameter.min);
        if (min !== undefined && numValue < min) {
            return {
                isValid: false,
                error: isRTL
                    ? `הערך חייב להיות לפחות ${min}`
                    : `Value must be at least ${min}`,
            };
        }

        const max = parseOptionalBound(parameter.max);
        if (max !== undefined && numValue > max) {
            return {
                isValid: false,
                error: isRTL
                    ? `הערך חייב להיות לכל היותר ${max}`
                    : `Value must be at most ${max}`,
            };
        }

        return { isValid: true, error: null };
    }

    if (
        parameter.type === "select" &&
        Array.isArray(parameter.options) &&
        parameter.options.length > 0
    ) {
        const validValues = parameter.options.map((opt) => String(opt.value));
        if (
            value === undefined ||
            value === null ||
            !validValues.includes(String(value))
        ) {
            return {
                isValid: false,
                error: isRTL ? "יש לבחור אפשרות תקפה" : "Please select a valid option",
            };
        }
    }

    return { isValid: true, error: null };
}

export function validateExperimentParameters(
    parameters = [],
    paramValues = {},
    isRTL = true
) {
    const errors = {};
    const byKey = {};

    if (Array.isArray(parameters)) {
        parameters.forEach((param) => {
            if (!param || !param.key || param.is_active === false) {
                return;
            }
            const result = validateParameterValue(
                param,
                paramValues?.[param.key],
                isRTL
            );
            byKey[param.key] = result;
            if (!result.isValid && result.error) {
                errors[param.key] = result.error;
            }
        });
    }

    return {
        isAllValid: Object.keys(errors).length === 0,
        errors,
        byKey,
    };
}
