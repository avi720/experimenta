import { useState, useCallback, useEffect } from "react";

/**
 * Generic hook for initializing, updating, and applying presets to an experiment's parameters.
 */
export function useExperimentParameters(experiment, extraDefaults = null) {
    const [parameters, setParameters] = useState({});
    const [selectedPreset, setSelectedPreset] = useState("");

    const initializeParameters = useCallback(() => {
        const defaultParams = { ...(extraDefaults || {}) };

        if (experiment?.parameters) {
            experiment.parameters.forEach((param) => {
                const defaultValue = param.default;
                if (param.type === "float" || param.type === "int") {
                    const parsedValue = parseFloat(defaultValue);
                    const fallback =
                        param.min !== null &&
                        typeof param.min !== "undefined" &&
                        !Number.isNaN(parseFloat(param.min))
                            ? parseFloat(param.min)
                            : 0;
                    defaultParams[param.key] = !Number.isNaN(parsedValue)
                        ? parsedValue
                        : fallback;
                } else if (param.type === "bool") {
                    defaultParams[param.key] =
                        defaultValue === true || defaultValue === "true";
                } else if (param.type === "select") {
                    defaultParams[param.key] =
                        defaultValue ||
                        (param.options && param.options.length > 0
                            ? param.options[0].value
                            : "");
                } else {
                    defaultParams[param.key] = defaultValue ?? "";
                }
            });
        }

        setParameters(defaultParams);
        setSelectedPreset("");
    }, [experiment, extraDefaults]);

    useEffect(() => {
        if (experiment) {
            initializeParameters();
        }
    }, [experiment, initializeParameters]);

    const applyPreset = useCallback(
        (presetKeyOrIndex) => {
            const presets = experiment?.presets;
            if (!presets || presets.length === 0) return;

            let preset = null;
            let resolvedKey = String(presetKeyOrIndex ?? "");

            if (presetKeyOrIndex && typeof presetKeyOrIndex === "object") {
                preset = presetKeyOrIndex;
                const idx = presets.indexOf(preset);
                resolvedKey = idx >= 0 ? String(idx) : preset.name_en || preset.name_he || "";
            } else {
                const numericIndex = Number(presetKeyOrIndex);
                if (
                    Number.isInteger(numericIndex) &&
                    numericIndex >= 0 &&
                    numericIndex < presets.length &&
                    String(numericIndex) === String(presetKeyOrIndex).trim()
                ) {
                    preset = presets[numericIndex];
                    resolvedKey = String(numericIndex);
                } else {
                    const foundIndex = presets.findIndex(
                        (p) =>
                            p.name_he === presetKeyOrIndex ||
                            p.name_en === presetKeyOrIndex
                    );
                    if (foundIndex >= 0) {
                        preset = presets[foundIndex];
                        resolvedKey = String(foundIndex);
                    }
                }
            }

            if (preset && preset.values) {
                const coercedValues = {};
                Object.entries(preset.values).forEach(([key, val]) => {
                    const paramDef = experiment?.parameters?.find((p) => p.key === key);
                    if (paramDef && (paramDef.type === "float" || paramDef.type === "int")) {
                        const num = parseFloat(val);
                        coercedValues[key] = Number.isNaN(num) ? val : num;
                    } else {
                        coercedValues[key] = val;
                    }
                });
                setParameters((prev) => ({ ...prev, ...coercedValues }));
                setSelectedPreset(resolvedKey);
            }
        },
        [experiment]
    );

    return {
        parameters,
        setParameters,
        selectedPreset,
        setSelectedPreset,
        initializeParameters,
        applyPreset,
    };
}
