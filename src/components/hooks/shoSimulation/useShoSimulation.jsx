import { useEffect, useRef } from 'react';
import { useShoParameters } from './useShoParameters';
import { useSimulationManager } from '../simulation/useSimulationManager';
import { useSimulationDataDisplay } from '../simulation/useSimulationDataDisplay';
import { useExperimentPersistence } from '../simulation/useExperimentPersistence';
import { calculateStep } from '../../simulation/engines/shoEngine';
import { useSimulationControlsLogic } from '../simulation/useSimulationControlsLogic';

export function useShoSimulation(experimentTemplate) {
    const experiment = experimentTemplate.experiment;
    const user = experimentTemplate.user;

    const {
        parameters,
        setParameters,
        selectedPreset,
        applyPreset
    } = useShoParameters(experiment);

    const prevParametersRef = useRef(null);

    const simulationManager = useSimulationManager({
        calculateStepFn: calculateStep,
        onSimulationComplete: (data) => {
            // Placeholder for future logic
        }
    });

    const controlsLogic = useSimulationControlsLogic({
        isSimulating: simulationManager.isSimulating,
        isPlaying: simulationManager.isPlaying,
        playbackTime: simulationManager.playbackTime,
        parameters: parameters,
        maxSimulationTime: simulationManager.maxSimulationTime,
        getMaxAvailableTime: simulationManager.getMaxAvailableTime,
        startSimulation: simulationManager.startSimulation,
        continueSimulation: simulationManager.continueSimulation,
        stopSimulation: simulationManager.stopSimulation,
        resetSimulation: simulationManager.resetSimulation,
        stepForward: simulationManager.stepForward,
        stepBackward: simulationManager.stepBackward,
        togglePlayback: simulationManager.togglePlayback,
        scrubSimulation: simulationManager.scrubSimulation
    });

    const dataDisplay = useSimulationDataDisplay({
        playbackTime: simulationManager.playbackTime,
        getDataPointAtTime: simulationManager.getDataPointAtTime,
        parameters: parameters
    });

    const { saveRun, exportData } = useExperimentPersistence(
        experiment,
        user,
        parameters,
        simulationManager.simulationData
    );

    useEffect(() => {
        const parametersChanged = prevParametersRef.current !== null && 
            JSON.stringify(prevParametersRef.current) !== JSON.stringify(parameters);

        prevParametersRef.current = { ...parameters };

        if (!parametersChanged) {
            return;
        }

        if (simulationManager.simulationStatus === 'running' || simulationManager.simulationStatus === 'initializing') {
            return;
        }
        
        if (simulationManager.simulationData.length > 0) {
            simulationManager.resetSimulation();
        }
    }, [parameters, simulationManager.simulationStatus, simulationManager.simulationData.length, simulationManager.resetSimulation]);

    return {
        parameters,
        setParameters,
        selectedPreset,
        applyPreset,
        simulationStatus: simulationManager.simulationStatus,
        simulationData: simulationManager.simulationData,
        currentTime: simulationManager.currentTime,
        playbackTime: simulationManager.playbackTime,
        validationState: simulationManager.validationState,
        isAllValid: simulationManager.isAllValid,
        maxSimulationTime: simulationManager.maxSimulationTime,
        displayedDataPoint: dataDisplay.displayedDataPoint,
        startSimulation: controlsLogic.startSimulation,
        pauseSimulation: controlsLogic.stopSimulation,
        continueSimulation: controlsLogic.continueSimulation,
        resetSimulation: controlsLogic.resetSimulation,
        stepForward: controlsLogic.stepForward,
        stepBackward: controlsLogic.stepBackward,
        scrubTime: controlsLogic.scrubSimulation,
        saveRun,
        exportData,
        FIXED_DT_ENGINE: simulationManager.FIXED_DT_ENGINE
    };
}