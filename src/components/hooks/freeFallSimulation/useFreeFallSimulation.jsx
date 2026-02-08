import { calculateFreeFallStep } from '../../simulation/engines/freeFallEngine';
import { useFreeFallParameters } from './useFreeFallParameters';
import { useSimulationManager } from '../simulation/useSimulationManager';
import { useSimulationControlsLogic } from '../simulation/useSimulationControlsLogic';
import { useSimulationDataDisplay } from '../simulation/useSimulationDataDisplay';
import { useExperimentPersistence } from '../simulation/useExperimentPersistence';

export function useFreeFallSimulation(experimentTemplate) {
    const {
        parameters,
        setParameters,
        selectedPreset,
        setSelectedPreset,
        initializeParameters,
        applyPreset,
        handleParameterChange,
        resetToPreset
    } = useFreeFallParameters(experimentTemplate);

    // חישוב maxSimulationTime מתוך הפרמטרים
    const maxSimulationTime = parseFloat(parameters?.t_max) || 60;

    const {
        simulationStatus,
        simulationData,
        currentTime,
        currentData,
        validationState,
        isAllValid,
        playbackTime: smPlaybackTime,
        getDataPointAtTime: smGetDataPointAtTime,
        isSimulating,
        isPlaying,
        getMaxAvailableTime,
        startSimulation: smStartSimulation,
        pauseSimulation: smPauseSimulation,
        continueSimulation: smContinueSimulation,
        resetSimulation: smResetSimulation,
        stepForward: smStepForward,
        stepBackward: smStepBackward,
        scrubSimulation: smScrubSimulation,
        togglePlayback: smTogglePlayback,
        stopSimulation: smStopSimulation,
        FIXED_DT_ENGINE
    } = useSimulationManager({
        calculateStepFn: calculateFreeFallStep,
        parameters: parameters,
        maxSimulationTime: maxSimulationTime,
        onSimulationComplete: (data) => {
            // Placeholder for future logic
        }
    });

    const {
        startSimulation,
        continueSimulation,
        resetSimulation,
        stepForward,
        stepBackward,
        togglePlayback,
        scrubSimulation
    } = useSimulationControlsLogic({
        isSimulating: isSimulating,
        isPlaying: isPlaying,
        playbackTime: smPlaybackTime,
        parameters: parameters,
        maxSimulationTime: maxSimulationTime,
        getMaxAvailableTime: getMaxAvailableTime,
        startSimulation: smStartSimulation,
        continueSimulation: smContinueSimulation,
        stopSimulation: smStopSimulation,
        resetSimulation: smResetSimulation,
        stepForward: smStepForward,
        stepBackward: smStepBackward,
        togglePlayback: smTogglePlayback,
        scrubSimulation: smScrubSimulation
    });

    const { displayedDataPoint } = useSimulationDataDisplay({
        playbackTime: smPlaybackTime,
        getDataPointAtTime: smGetDataPointAtTime,
        parameters: parameters
    });

    const { saveRun, exportData } = useExperimentPersistence(
        experimentTemplate,
        null,
        parameters,
        simulationData
    );

    return {
        parameters,
        setParameters,
        handleParameterChange,
        resetToPreset,
        simulationStatus,
        simulationData,
        currentTime,
        playbackTime: smPlaybackTime,
        displayedDataPoint,
        selectedPreset,
        validationState,
        isAllValid,
        initializeParameters,
        startSimulation,
        pauseSimulation: smPauseSimulation,
        continueSimulation,
        resetSimulation,
        stepForward,
        stepBackward,
        scrubTime: scrubSimulation,
        applyPreset,
        saveRun,
        exportData,
        maxSimulationTime,
        FIXED_DT_ENGINE
    };
}