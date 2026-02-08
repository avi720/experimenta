// אף אחד לא משתמש בקובץ הזה. לבדיקה האם למחוק או להחליף במשהו שלא עובד

import { useCallback } from 'react';

export function useSimulationControls({
    parameters,
    simulationStatus,
    simulationData,
    setSimulationStatus,
    setSimulationData,
    setCurrentTime,
    setPlaybackTime,
    setDisplayedDataPoint,
    calculateStep,
    timeRef,
    stepAccumulator
}) {
    const startSimulation = useCallback(() => {
        if (simulationStatus === 'idle' || simulationStatus === 'ended') {
            const initialState = calculateStep(0, parameters);
            setSimulationData([initialState]);
            timeRef.current = 0;
            setCurrentTime(0);
            setPlaybackTime(0);
            stepAccumulator.current = 0;
            setDisplayedDataPoint(initialState);
        }
        setSimulationStatus('running');
    }, [simulationStatus, parameters, setSimulationStatus, setSimulationData, setCurrentTime, setPlaybackTime, setDisplayedDataPoint, calculateStep, timeRef, stepAccumulator]);

    const pauseSimulation = useCallback(() => {
        setSimulationStatus('paused');
    }, [setSimulationStatus]);
    
    const resetSimulation = useCallback(() => {
        setSimulationStatus('idle');
        const initialState = calculateStep(0, parameters);
        setSimulationData([initialState]);
        timeRef.current = 0;
        setCurrentTime(0);
        setPlaybackTime(0);
        stepAccumulator.current = 0;
        setDisplayedDataPoint(initialState);
    }, [parameters, setSimulationStatus, setSimulationData, setCurrentTime, setPlaybackTime, setDisplayedDataPoint, calculateStep, timeRef, stepAccumulator]);

    const handleStep = useCallback((direction) => {
        if (simulationData.length === 0) return;
        const currentIndex = simulationData.findIndex(d => d.time >= setPlaybackTime);
        let newIndex = direction === 'forward' 
            ? Math.min(currentIndex + 1, simulationData.length - 1)
            : Math.max(currentIndex - 1, 0);
        setPlaybackTime(simulationData[newIndex].time);
    }, [simulationData, setPlaybackTime]);

    const handleScrub = useCallback((newTime) => {
        setPlaybackTime(newTime[0]);
    }, [setPlaybackTime]);

    return {
        startSimulation,
        pauseSimulation,
        resetSimulation,
        handleStep,
        handleScrub
    };
}