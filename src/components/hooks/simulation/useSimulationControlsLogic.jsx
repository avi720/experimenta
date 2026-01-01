import { useCallback } from 'react';

export function useSimulationControlsLogic({
    isSimulating,
    isPlaying,
    playbackTime,
    parameters,
    maxSimulationTime,
    getMaxAvailableTime,
    startSimulation: smStartSimulation,
    continueSimulation: smContinueSimulation,
    stopSimulation: smStopSimulation,
    resetSimulation: smResetSimulation,
    stepForward: smStepForward,
    stepBackward: smStepBackward,
    togglePlayback: smTogglePlayback,
    scrubSimulation: smScrubSimulation
}) {
    /**
     * מטפל בהתחלת סימולציה
     */
    const startSimulation = useCallback(() => {
        smStartSimulation(parameters, maxSimulationTime);
    }, [smStartSimulation, parameters, maxSimulationTime]);

    /**
     * מטפל בהמשך סימולציה
     */
    const continueSimulation = useCallback(() => {
        smContinueSimulation(parameters, maxSimulationTime);
    }, [smContinueSimulation, parameters, maxSimulationTime]);

    /**
     * מטפל בעצירת סימולציה
     */
    const stopSimulation = useCallback(() => {
        smStopSimulation();
    }, [smStopSimulation]);

    /**
     * מטפל באיפוס סימולציה
     */
    const resetSimulation = useCallback(() => {
        smResetSimulation();
    }, [smResetSimulation]);

    /**
     * מטפל בצעד קדימה
     * מקבל את userDt מהפרמטרים
     */
    const stepForward = useCallback(() => {
        // מחפש פרמטר dt בפרמטרים
        const userDt = parameters.dt || parameters.userDt || 0.01; // ברירת מחדל: 0.01s
        smStepForward(userDt);
    }, [smStepForward, parameters]);

    /**
     * מטפל בצעד אחורה
     * מקבל את userDt מהפרמטרים
     */
    const stepBackward = useCallback(() => {
        // מחפש פרמטר dt בפרמטרים
        const userDt = parameters.dt || parameters.userDt || 0.01; // ברירת מחדל: 0.01s
        smStepBackward(userDt);
    }, [smStepBackward, parameters]);

    /**
     * מטפל בהפעלה/השהיה אוטומטית
     */
    const togglePlayback = useCallback(() => {
        smTogglePlayback();
    }, [smTogglePlayback]);

    /**
     * מטפל בגרירת ציר הזמן
     */
    const scrubSimulation = useCallback((newTime) => {
        smScrubSimulation(newTime);
    }, [smScrubSimulation]);

    /**
     * בודק האם אפשר להמשיך את הסימולציה
     */
    const canContinue = useCallback(() => {
        const maxTime = getMaxAvailableTime();
        return maxTime < maxSimulationTime && !isSimulating;
    }, [getMaxAvailableTime, maxSimulationTime, isSimulating]);

    return {
        startSimulation,
        continueSimulation,
        stopSimulation,
        resetSimulation,
        stepForward,
        stepBackward,
        togglePlayback,
        scrubSimulation,
        canContinue
    };
}