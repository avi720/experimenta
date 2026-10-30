/**
 * Single source of truth for runtime experiment parameter validation (T28).
 */
import { translate, type LocaleInput } from "@/i18n";
import type { Parameter, ParameterValues } from "@/types/experiment";
import type { ParameterValidationResult, ParameterValidationState } from "@/types/simulation";

function parseOptionalBound(bound: Parameter["min"]): number | undefined {
    if (bound === undefined || bound === null || String(bound).trim() === "") {
        return undefined;
    }
    const parsed = parseFloat(String(bound));
    return Number.isNaN(parsed) ? undefined : parsed;
}

/**
 * Whether a parameter applies to the current values: active, and its `visible_when` condition
 * (if any) holds. Hidden parameters are neither shown nor validated.
 */
export function isParameterVisible(
    parameter: Parameter | null | undefined,
    paramValues: ParameterValues | null | undefined
): boolean {
    if (!parameter || !parameter.key || parameter.is_active === false) return false;
    const condition = parameter.visible_when;
    if (!condition || !condition.key) return true;
    return String(paramValues?.[condition.key]) === String(condition.equals);
}

export function validateParameterValue(
    parameter: Parameter | null | undefined,
    value: unknown,
    isRTL: LocaleInput = true
): ParameterValidationResult {
    if (!parameter || !parameter.key || parameter.is_active === false) {
        return { isValid: true, error: null };
    }

    if (parameter.type === "float" || parameter.type === "int") {
        if (value === undefined || value === null || String(value).trim() === "") {
            return {
                isValid: false,
                error: translate(isRTL, "workspace.validation.required"),
            };
        }

        const numValue = typeof value === "number" ? value : Number(String(value).trim());
        if (Number.isNaN(numValue) || !Number.isFinite(numValue)) {
            return {
                isValid: false,
                error: translate(isRTL, "workspace.validation.invalidNumber"),
            };
        }

        if (parameter.type === "int" && !Number.isInteger(numValue)) {
            return {
                isValid: false,
                error: translate(isRTL, "workspace.validation.invalidInteger"),
            };
        }

        const min = parseOptionalBound(parameter.min);
        if (min !== undefined && numValue < min) {
            return {
                isValid: false,
                error: translate(isRTL, "workspace.validation.minBound", { min }),
            };
        }

        const max = parseOptionalBound(parameter.max);
        if (max !== undefined && numValue > max) {
            return {
                isValid: false,
                error: translate(isRTL, "workspace.validation.maxBound", { max }),
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
                error: translate(isRTL, "workspace.validation.invalidOption"),
            };
        }
    }

    return { isValid: true, error: null };
}

export function validateExperimentParameters(
    parameters: Parameter[] | null | undefined = [],
    paramValues: ParameterValues | null | undefined = {},
    isRTL: LocaleInput = true
): ParameterValidationState {
    const errors: Record<string, string> = {};
    const byKey: Record<string, ParameterValidationResult> = {};

    if (Array.isArray(parameters)) {
        parameters.forEach((param) => {
            if (!param || !isParameterVisible(param, paramValues)) {
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
