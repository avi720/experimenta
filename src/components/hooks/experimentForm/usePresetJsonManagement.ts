import { useState, useCallback, useEffect, useRef } from 'react';
import type { PresetTextValues } from '@/types/admin';
import type { ExperimentFormData } from '@/types/experiment';
import type { ExperimentFormHandlers } from './useExperimentFormHandlers';

export function usePresetJsonManagement(
    experiment: ExperimentFormData | null,
    handleNestedDynamicChange: ExperimentFormHandlers['handleNestedDynamicChange']
) {
    const [presetTextValues, setPresetTextValues] = useState<PresetTextValues>({});
    const initializedForKeyRef = useRef<string | null>(null);
    const prevPresetsLengthRef = useRef(0);

    // Initialize preset text values once per loaded experiment, and populate only new indices when presets are added (T34)
    useEffect(() => {
        if (!experiment) return;

        const experimentIdentity = experiment.id || '__new__';
        const presets = Array.isArray(experiment.presets) ? experiment.presets : [];

        if (initializedForKeyRef.current !== experimentIdentity) {
            initializedForKeyRef.current = experimentIdentity;
            prevPresetsLengthRef.current = presets.length;
            const initialTexts: PresetTextValues = {};
            presets.forEach((preset, index) => {
                initialTexts[index] = JSON.stringify(preset.values || {}, null, 2);
            });
            setPresetTextValues(initialTexts);
            return;
        }

        if (presets.length > prevPresetsLengthRef.current) {
            setPresetTextValues(prev => {
                const next = { ...prev };
                presets.forEach((preset, index) => {
                    if (!(index in next)) {
                        next[index] = JSON.stringify(preset.values || {}, null, 2);
                    }
                });
                return next;
            });
        }
        prevPresetsLengthRef.current = presets.length;
    }, [experiment, experiment?.id, experiment?.presets]);

    const handlePresetValuesChange = useCallback((index: number, textValue: string) => {
        setPresetTextValues(prev => ({ ...prev, [index]: textValue }));

        try {
            const parsed: unknown = JSON.parse(textValue);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                handleNestedDynamicChange('presets', index, 'values', null, null, parsed);
            }
        } catch {
            // Keep raw text in presetTextValues so the user can finish editing; validateForm blocks Save on invalid JSON
        }
    }, [handleNestedDynamicChange]);

    const handleRemovePresetText = useCallback((removedIndex: number) => {
        setPresetTextValues(prev => {
            const next: PresetTextValues = {};
            Object.keys(prev)
                .map(Number)
                .sort((a, b) => a - b)
                .forEach(idx => {
                    if (idx < removedIndex) {
                        next[idx] = prev[idx];
                    } else if (idx > removedIndex) {
                        next[idx - 1] = prev[idx];
                    }
                });
            return next;
        });
    }, []);

    return {
        presetTextValues,
        handlePresetValuesChange,
        handleRemovePresetText
    };
}
