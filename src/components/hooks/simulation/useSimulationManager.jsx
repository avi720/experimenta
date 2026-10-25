import { useState, useEffect, useRef, useCallback } from 'react';
import { useSimulationEngineLogic } from './useSimulationEngineLogic';

export function useSimulationManager({
    calculateStepFn,
    parameters,
    maxSimulationTime,
    playbackSpeed = 1.0
}) {
    const [simulationStatus, setSimulationStatus] = useState('idle');
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackTime, setPlaybackTime] = useState(0);

    const playbackIntervalRef = useRef(null);
    const lastUpdateTimeRef = useRef(null);
    const playbackTimeRef = useRef(0);
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            if (playbackIntervalRef.current) {
                clearInterval(playbackIntervalRef.current);
                playbackIntervalRef.current = null;
            }
        };
    }, []);

    const handleEngineComplete = useCallback((data) => {
        if (!isMountedRef.current) return;
        if (data && data.length > 0) {
            const lastPoint = data[data.length - 1];
            playbackTimeRef.current = 0;
            setPlaybackTime(0);
            if (lastPoint.shouldStop) {
                setSimulationStatus('completed');
                setIsPlaying(true);
            } else {
                setSimulationStatus('running');
                setIsPlaying(true);
            }
        } else {
            setSimulationStatus('idle');
            setIsPlaying(false);
        }
    }, []);

    const {
        isSimulating,
        simulationData,
        startSimulation: engineStartSimulation,
        continueSimulation: engineContinueSimulation,
        stopSimulation: engineStopSimulation,
        resetSimulation: engineResetSimulation,
        getMaxAvailableTime,
        getDataPointAtTime
    } = useSimulationEngineLogic({
        calculateStepFn,
        onSimulationComplete: handleEngineComplete
    });

    useEffect(() => {
        if (!isPlaying || isSimulating) {
            if (playbackIntervalRef.current) {
                clearInterval(playbackIntervalRef.current);
                playbackIntervalRef.current = null;
            }
            return;
        }

        const maxAvailableTime = getMaxAvailableTime();
        if (maxAvailableTime <= 0 || playbackTimeRef.current >= maxAvailableTime) {
            setIsPlaying(false);
            if (playbackTimeRef.current >= maxAvailableTime && maxAvailableTime > 0) {
                setSimulationStatus('completed');
            }
            return;
        }

        lastUpdateTimeRef.current = Date.now();

        playbackIntervalRef.current = setInterval(() => {
            if (!isMountedRef.current) return;
            const now = Date.now();
            const dt = (now - lastUpdateTimeRef.current) / 1000;
            lastUpdateTimeRef.current = now;

            const currentMaxAvailableTime = getMaxAvailableTime();
            const newTime = playbackTimeRef.current + dt * playbackSpeed;

            if (newTime >= currentMaxAvailableTime) {
                playbackTimeRef.current = currentMaxAvailableTime;
                if (playbackIntervalRef.current) {
                    clearInterval(playbackIntervalRef.current);
                    playbackIntervalRef.current = null;
                }
                setPlaybackTime(currentMaxAvailableTime);
                setIsPlaying(false);
                setSimulationStatus('completed');
                return;
            }

            playbackTimeRef.current = newTime;
            setPlaybackTime(newTime);
        }, 16);

        return () => {
            if (playbackIntervalRef.current) {
                clearInterval(playbackIntervalRef.current);
                playbackIntervalRef.current = null;
            }
        };
    }, [isPlaying, isSimulating, playbackSpeed, getMaxAvailableTime]);

    const startSimulation = useCallback(() => {
        playbackTimeRef.current = 0;
        setPlaybackTime(0);
        setSimulationStatus('calculating');
        setIsPlaying(false);
        engineStartSimulation(parameters, maxSimulationTime);
    }, [parameters, maxSimulationTime, engineStartSimulation]);

    const pauseSimulation = useCallback(() => {
        setIsPlaying(false);
        setSimulationStatus('paused');
    }, []);

    const continueSimulation = useCallback(() => {
        const maxAvailable = getMaxAvailableTime();
        const lastPoint = simulationData[simulationData.length - 1];
        if (
            maxAvailable < maxSimulationTime &&
            playbackTimeRef.current >= maxAvailable &&
            !lastPoint?.shouldStop
        ) {
            setSimulationStatus('calculating');
            setIsPlaying(false);
            engineContinueSimulation(parameters, maxSimulationTime);
            return;
        }
        if (playbackTimeRef.current >= maxAvailable && maxAvailable > 0) {
            playbackTimeRef.current = 0;
            setPlaybackTime(0);
        }
        setIsPlaying(true);
        setSimulationStatus('running');
    }, [getMaxAvailableTime, simulationData, maxSimulationTime, engineContinueSimulation, parameters]);

    const resetSimulation = useCallback(() => {
        if (playbackIntervalRef.current) {
            clearInterval(playbackIntervalRef.current);
            playbackIntervalRef.current = null;
        }
        setIsPlaying(false);
        playbackTimeRef.current = 0;
        setPlaybackTime(0);
        setSimulationStatus('idle');
        engineResetSimulation();
    }, [engineResetSimulation]);

    const stepForward = useCallback(() => {
        const step = 0.1;
        const maxAvailable = getMaxAvailableTime();
        const newTime = Math.min(playbackTimeRef.current + step, maxAvailable);
        playbackTimeRef.current = newTime;
        setPlaybackTime(newTime);
    }, [getMaxAvailableTime]);

    const stepBackward = useCallback(() => {
        const step = 0.1;
        const newTime = Math.max(playbackTimeRef.current - step, 0);
        playbackTimeRef.current = newTime;
        setPlaybackTime(newTime);
    }, []);

    const scrubSimulation = useCallback((time) => {
        const maxAvailable = getMaxAvailableTime();
        const clampedTime = Math.max(0, Math.min(time, maxAvailable));
        playbackTimeRef.current = clampedTime;
        setPlaybackTime(clampedTime);
    }, [getMaxAvailableTime]);

    const stopSimulation = useCallback(() => {
        engineStopSimulation();
        setIsPlaying(false);
    }, [engineStopSimulation]);

    const togglePlayback = useCallback(() => {
        if (simulationStatus === 'calculating') return;

        if (isPlaying) {
            pauseSimulation();
        } else {
            continueSimulation();
        }
    }, [isPlaying, simulationStatus, pauseSimulation, continueSimulation]);

    return {
        simulationStatus,
        isPlaying,
        isSimulating,
        playbackTime,
        simulationData,
        startSimulation,
        pauseSimulation,
        continueSimulation,
        resetSimulation,
        stepForward,
        stepBackward,
        scrubSimulation,
        stopSimulation,
        togglePlayback,
        getMaxAvailableTime,
        getDataPointAtTime
    };
}
