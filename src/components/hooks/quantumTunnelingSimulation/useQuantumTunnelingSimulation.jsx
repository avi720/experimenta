import { calculateQuantumTunnelingStep } from '../../simulation/engines/quantumTunnelingEngine';
import { useQuantumTunnelingParameters } from './useQuantumTunnelingParameters';
import { useSimulationManager } from '../simulation/useSimulationManager';
import { useSimulationDataDisplay } from '../shoSimulation/useSimulationDataDisplay';
import { useExperimentPersistence } from '../shoSimulation/useExperimentPersistence';
import { useSimulationControlsLogic } from '../simulation/useSimulationControlsLogic';

export function useQuantumTunnelingSimulation(experimentTemplate) {
    const { parameters, setParameters, handleParameterChange, resetToPreset } = useQuantumTunnelingParameters(experimentTemplate);

    const simulationManager = useSimulationManager({
        calculateStepFn: calculateQuantumTunnelingStep,
        onSimulationComplete: (data) => {
            // Placeholder for future logic
        },
        parameters: parameters,
        initialExperimentParams: experimentTemplate?.parameters || []
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

    const displayedDataPoint = useSimulationDataDisplay({
        playbackTime: simulationManager.playbackTime,
        getDataPointAtTime: simulationManager.getDataPointAtTime,
        parameters: parameters
    });

    const { saveRun, exportData } = useExperimentPersistence({
        experiment: experimentTemplate,
        parameters,
        simulationData: simulationManager.simulationData
    });

    return {
        parameters,
        setParameters,
        handleParameterChange,
        resetToPreset,
        simulationStatus: simulationManager.simulationStatus,
        simulationData: simulationManager.simulationData,
        currentTime: simulationManager.currentTime,
        currentData: simulationManager.currentData,
        playbackTime: simulationManager.playbackTime,
        validationState: simulationManager.validationState,
        isAllValid: simulationManager.isAllValid,
        maxSimulationTime: simulationManager.maxSimulationTime,
        displayedDataPoint,
        startSimulation: controlsLogic.startSimulation,
        pauseSimulation: controlsLogic.stopSimulation,
        continueSimulation: controlsLogic.continueSimulation,
        resetSimulation: controlsLogic.resetSimulation,
        stepForward: controlsLogic.stepForward,
        stepBackward: controlsLogic.stepBackward,
        scrubSimulation: controlsLogic.scrubSimulation,
        saveRun,
        exportData,
        FIXED_DT_ENGINE: simulationManager.FIXED_DT_ENGINE
    };
}