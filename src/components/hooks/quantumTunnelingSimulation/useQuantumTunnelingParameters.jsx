import { useState, useCallback, useEffect } from 'react';

export function useQuantumTunnelingParameters(experiment) {
    const [parameters, setParameters] = useState({});
    const [selectedPreset, setSelectedPreset] = useState("");

    const initializeParameters = useCallback(() => {
        if (!experiment?.parameters) {
            return;
        }

        const defaultParams = {};
        experiment.parameters.forEach(param => {
            const defaultValue = param.default;
            if (param.type === 'float' || param.type === 'int') {
                const parsedValue = parseFloat(defaultValue);
                const fallback = (param.min !== null && typeof param.min !== 'undefined' && !isNaN(parseFloat(param.min))) 
                                 ? parseFloat(param.min) 
                                 : 0;
                const finalValue = !isNaN(parsedValue) ? parsedValue : fallback;
                defaultParams[param.key] = finalValue;
            } else if (param.type === 'bool') {
                defaultParams[param.key] = defaultValue === true || defaultValue === 'true';
            } else if (param.type === 'select') {
                defaultParams[param.key] = defaultValue || (param.options && param.options.length > 0 ? param.options[0].value : '');
            } else {
                defaultParams[param.key] = defaultValue || '';
            }
        });

        setParameters(defaultParams);
    }, [experiment]);

    useEffect(() => {
        if (experiment) {
            initializeParameters();
        }
    }, [experiment, initializeParameters]);

    const applyPreset = useCallback((presetKey) => {
        if (!experiment?.presets) return;
        
        const preset = experiment.presets.find(p => p.name_he === presetKey || p.name_en === presetKey);
        if (preset && preset.values) {
            setParameters(prev => ({ ...prev, ...preset.values }));
            setSelectedPreset(presetKey);
        }
    }, [experiment]);

    return {
        parameters,
        setParameters,
        selectedPreset,
        setSelectedPreset,
        initializeParameters,
        applyPreset
    };
}