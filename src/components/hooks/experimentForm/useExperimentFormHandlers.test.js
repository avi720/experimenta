import { describe, it, expect } from "vitest";
import { useExperimentFormHandlers } from "./useExperimentFormHandlers";

// Minimal mock for React's useCallback so we can test the state-updater functions directly in Node
import { vi } from "vitest";
vi.mock("react", () => ({
    useCallback: (fn) => fn,
}));

describe("useExperimentFormHandlers (T4)", () => {
    it("updates nested object keys when nestedIndex is null and field is provided (i18n_labels / tooltip)", () => {
        let state = {
            parameters: [
                {
                    key: "g",
                    i18n_labels: { he: "כבידה", en: "Gravity" },
                    tooltip: { he: "", en: "" },
                },
            ],
        };
        const setExperiment = (updater) => {
            state = typeof updater === "function" ? updater(state) : updater;
        };

        const { handleNestedDynamicChange } = useExperimentFormHandlers(
            state,
            setExperiment
        );

        handleNestedDynamicChange(
            "parameters",
            0,
            "i18n_labels",
            null,
            "he",
            "תאוצת הכובד"
        );
        expect(state.parameters[0].i18n_labels).toEqual({
            he: "תאוצת הכובד",
            en: "Gravity",
        });

        handleNestedDynamicChange(
            "parameters",
            0,
            "tooltip",
            null,
            "en",
            "Gravitational acceleration"
        );
        expect(state.parameters[0].tooltip).toEqual({
            he: "",
            en: "Gravitational acceleration",
        });
    });

    it("replaces entire nested object when both nestedIndex and field are null (preset values JSON)", () => {
        let state = {
            presets: [
                {
                    name_he: "ירח",
                    name_en: "Moon",
                    values: { g: 9.81 },
                },
            ],
        };
        const setExperiment = (updater) => {
            state = typeof updater === "function" ? updater(state) : updater;
        };

        const { handleNestedDynamicChange } = useExperimentFormHandlers(
            state,
            setExperiment
        );

        handleNestedDynamicChange("presets", 0, "values", null, null, {
            g: 1.62,
            h0: 20,
        });
        expect(state.presets[0].values).toEqual({ g: 1.62, h0: 20 });
    });

    it("updates nested array item when nestedIndex is a number (select parameter options)", () => {
        let state = {
            parameters: [
                {
                    key: "medium",
                    type: "select",
                    options: [
                        { value: "vacuum", label_he: "ריק", label_en: "Vacuum" },
                    ],
                },
            ],
        };
        const setExperiment = (updater) => {
            state = typeof updater === "function" ? updater(state) : updater;
        };

        const { handleNestedDynamicChange } = useExperimentFormHandlers(
            state,
            setExperiment
        );

        handleNestedDynamicChange(
            "parameters",
            0,
            "options",
            0,
            "label_en",
            "Outer Space"
        );
        expect(state.parameters[0].options[0]).toEqual({
            value: "vacuum",
            label_he: "ריק",
            label_en: "Outer Space",
        });
    });
});
