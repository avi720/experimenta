import { describe, it, expect } from "vitest";
import { validateExperimentForm } from "./useExperimentValidation";
import { createEmptyExperiment } from "./useExperimentDataLoading";
import { categoryOptions } from "@/components/pagesComponents/admin/AdminExperimentForm/adminFormConstants";

describe("Admin experiment form validation & defaults (T32, T33, T34)", () => {
    const validBaseExperiment = () => ({
        id: "exp-1",
        slug: "free-fall",
        category: "ClassicalMechanics",
        visualization_type: "3d",
        access_level: "public",
        i18n_texts: {
            he: { title: "נפילה חופשית", short_desc: "תיאור בעברית", steps: [], safety_notes: "" },
            en: { title: "Free Fall", short_desc: "English description", steps: [], safety_notes: "" },
        },
        parameters: [
            {
                key: "h0",
                type: "float",
                default: "50",
                min: "1",
                max: "500",
                step: "1",
                options: [],
            },
            {
                key: "medium",
                type: "select",
                default: "air",
                options: [
                    { value: "air", label_he: "אוויר", label_en: "Air" },
                    { value: "vacuum", label_he: "ריק", label_en: "Vacuum" },
                ],
            },
        ],
        presets: [
            {
                name_he: "ברירת מחדל",
                name_en: "Default",
                values: { h0: 50, medium: "air" },
            },
        ],
    });

    it("createEmptyExperiment uses a valid category from categoryOptions and public access_level (T32)", () => {
        const empty = createEmptyExperiment();
        expect(categoryOptions.some((opt) => opt.value === empty.category)).toBe(true);
        expect(empty.access_level).toBe("public");
    });

    it("enforces slug format and slug uniqueness against existing experiments (T33)", () => {
        const badFormat = { ...validBaseExperiment(), slug: "Free_Fall!" };
        const formatErrors = validateExperimentForm(badFormat);
        expect(formatErrors.slug).toBeDefined();

        const duplicateSlug = { ...validBaseExperiment(), id: "exp-2", slug: "free-fall" };
        const dupErrors = validateExperimentForm(duplicateSlug, {
            existingExperiments: [{ id: "exp-1", slug: "free-fall" }],
        });
        expect(dupErrors.slug).toContain("כבר קיים");

        // Same ID editing its own slug is valid
        const selfErrors = validateExperimentForm(validBaseExperiment(), {
            existingExperiments: [{ id: "exp-1", slug: "free-fall" }],
        });
        expect(selfErrors.slug).toBeUndefined();
    });

    it("rejects select parameter when default is not among its options (T33)", () => {
        const exp = validBaseExperiment();
        exp.parameters[1].default = "water";
        const errors = validateExperimentForm(exp);
        expect(errors.param_1_default).toContain("אחת מאפשרויות הבחירה");
    });

    it("rejects invalid numeric parameter values and out-of-range defaults (T33)", () => {
        const exp = validBaseExperiment();
        exp.parameters[0].type = "int";
        exp.parameters[0].default = "12.5";
        const intErrors = validateExperimentForm(exp);
        expect(intErrors.param_0_default).toContain("מספר שלם");

        const outOfRange = validBaseExperiment();
        outOfRange.parameters[0].default = "900";
        const rangeErrors = validateExperimentForm(outOfRange);
        expect(rangeErrors.param_0_default).toContain("500");
    });

    it("blocks Save when preset JSON is invalid or empty, or contains keys not in parameters (T33, T34)", () => {
        const exp = validBaseExperiment();

        const invalidJsonErrors = validateExperimentForm(exp, {
            presetTextValues: { 0: "{bad json" },
        });
        expect(invalidJsonErrors.preset_0_values).toContain("פורמט JSON לא תקין");

        const emptyJsonErrors = validateExperimentForm(exp, {
            presetTextValues: { 0: "" },
        });
        expect(emptyJsonErrors.preset_0_values).toContain("פורמט JSON לא תקין");

        const unknownKeyErrors = validateExperimentForm(exp, {
            presetTextValues: { 0: JSON.stringify({ h0: 50, unknown_param: 10 }) },
        });
        expect(unknownKeyErrors.preset_0_values).toContain("unknown_param");
    });
});
