import { useState, useCallback, useEffect } from 'react';

export function usePresetJsonManagement(experiment, handleNestedDynamicChange) {
    const [presetTextValues, setPresetTextValues] = useState({});

    // Initialize preset text values when experiment changes
    useEffect(() => {
        if (experiment?.presets) {
            const textVals = {};
            experiment.presets.forEach((preset, index) => {
                textVals[index] = JSON.stringify(preset.values || {}, null, 2);
            });
            setPresetTextValues(textVals);
        }
    }, [experiment?.presets]);

    const handlePresetValuesChange = useCallback((index, textValue) => {
        setPresetTextValues(prev => ({ ...prev, [index]: textValue }));
        
        try {
            const parsed = JSON.parse(textValue);
            handleNestedDynamicChange('presets', index, 'values', null, null, parsed);
        } catch (error) {
            // Invalid JSON, don't update the actual values
        }
    }, [handleNestedDynamicChange]);

    return {
        presetTextValues,
        handlePresetValuesChange
    };
}