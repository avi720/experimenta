import { describe, it, expect } from "vitest";
import {
    validateParameterValue,
    validateExperimentParameters,
} from "./parameterValidation";

describe("parameterValidation (T28)", () => {
    const freeFallParams = [
        { key: "h0", type: "float", min: 1, max: 500, is_active: true },
        { key: "m", type: "float", min: 0.1, max: 100, is_active: true },
        { key: "n_steps", type: "int", min: 1, max: 1000, is_active: true },
        {
            key: "medium",
            type: "select",
            options: [{ value: "air" }, { value: "vacuum" }],
            is_active: true,
        },
    ];

    it("rejects out-of-range numeric values (e.g. mass 0 on Free Fall) with localized messages", () => {
        const heResult = validateParameterValue(freeFallParams[1], 0, true);
        expect(heResult).toEqual({
            isValid: false,
            error: "הערך חייב להיות לפחות 0.1",
        });

        const enResult = validateParameterValue(freeFallParams[1], 0, false);
        expect(enResult).toEqual({
            isValid: false,
            error: "Value must be at least 0.1",
        });

        const maxResult = validateParameterValue(freeFallParams[0], 600, false);
        expect(maxResult).toEqual({
            isValid: false,
            error: "Value must be at most 500",
        });
    });

    it("rejects empty values, non-integers for int parameters, and invalid select options", () => {
        expect(validateParameterValue(freeFallParams[0], "", true)).toEqual({
            isValid: false,
            error: "שדה זה הוא חובה",
        });

        expect(validateParameterValue(freeFallParams[2], 2.5, false)).toEqual({
            isValid: false,
            error: "Please enter a whole number",
        });

        expect(
            validateParameterValue(freeFallParams[3], "water", false)
        ).toEqual({
            isValid: false,
            error: "Please select a valid option",
        });
    });

    it("computes aggregate validationState across all active parameters", () => {
        const invalidState = validateExperimentParameters(
            freeFallParams,
            { h0: 50, m: 0, n_steps: 10, medium: "air" },
            false
        );
        expect(invalidState.isAllValid).toBe(false);
        expect(invalidState.errors).toEqual({
            m: "Value must be at least 0.1",
        });
        expect(invalidState.byKey.m.isValid).toBe(false);
        expect(invalidState.byKey.h0.isValid).toBe(true);

        const validState = validateExperimentParameters(
            freeFallParams,
            { h0: 50, m: 1, n_steps: 10, medium: "air" },
            false
        );
        expect(validState.isAllValid).toBe(true);
        expect(validState.errors).toEqual({});
    });
});
