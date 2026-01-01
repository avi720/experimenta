
// Assuming React is available in the environment,
// but no direct React hooks like useState, useEffect are called within useShoSimulation itself,
// as it primarily orchestrates other custom hooks.

// Import necessary custom hooks and utility functions.
// Adjust paths based on your project's actual file structure.
// For example, if useShoSimulation.js is in 'src/hooks',
// and useShoParameters.js, useSimulationManager.js are also in 'src/hooks',
// and shoCalculator.js is in 'src/utils'.
import { useShoParameters } from './useShoParameters';
import { useSimulationManager } from './useSimulationManager';
import { calculateShoStep } from '../utils/shoCalculator'; // Or adjust path as needed

/**
 * useShoSimulation is a primary hook that orchestrates parameter management
 * and simulation execution for a Simple Harmonic Oscillator (SHO) experiment.
 * It combines functionalities from useShoParameters and useSimulationManager
 * to provide a comprehensive interface for controlling and observing the simulation.
 *
 * @param {object} experiment - An object containing experiment-specific configurations,
 *                              including default parameters for the SHO.
 * @returns {object} An object containing all states and control functions for
 *                   parameter management and simulation playback.
 */
export function useShoSimulation(experiment) {
    // 1. Parameter Management: Uses useShoParameters to handle the experiment's input parameters.
    // This includes getting current parameters, setting them, handling individual changes,
    // and resetting to preset values.
    const { parameters, setParameters, handleParameterChange, resetToPreset } = useShoParameters(experiment);

    // 2. Simulation Management: Uses useSimulationManager to control the simulation lifecycle.
    // It takes the current parameters, a step calculation function (calculateShoStep),
    // and original experiment parameters (for context/validation) to manage simulation
    // status, data, playback, validation, and control actions.
    const {
        simulationStatus,
        simulationData,
        currentTime,
        playbackTime,
        currentData,
        validationState,
        isAllValid,
        startSimulation,
        pauseSimulation,
        continueSimulation,
        resetSimulation,
        stepForward,
        stepBackward,
        scrubSimulation,
        maxSimulationTime
    } = useSimulationManager(parameters, calculateShoStep, experiment?.parameters || []);

    // 3. Return combined state and actions:
    // This hook acts as an aggregator, exposing all relevant states and functions
    // from the underlying parameter and simulation management hooks to its consumers.
    return {
        // Parameters management
        parameters,
        setParameters,
        handleParameterChange,
        resetToPreset,

        // Simulation management
        simulationStatus,
        simulationData,
        currentTime,
        playbackTime,
        currentData,
        validationState,
        isAllValid,
        startSimulation,
        pauseSimulation,
        continueSimulation,
        resetSimulation,
        stepForward,
        stepBackward,
        scrubSimulation,
        maxSimulationTime
    };
}
