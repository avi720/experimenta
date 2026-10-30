import { useState, useEffect, useRef, useCallback } from 'react';
import { useSimulationEngineLogic } from './useSimulationEngineLogic';
import type { EngineInput, SimulationStatus, SimulationStepFn, TimeSample } from '@/types/simulation';

type SimulationManagerOptions = {
    calculateStepFn: SimulationStepFn;
    parameters: EngineInput;
    maxSimulationTime: number;
    playbackSpeed?: number;
};

export function useSimulationManager({
    calculateStepFn,
    parameters,
    maxSimulationTime,
    playbackSpeed = 1.0
}: SimulationManagerOptions) {
    const [simulationStatus, setSimulationStatus] = useState<SimulationStatus>('idle');
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackTime, setPlaybackTime] = useState(0);
    // The furthest time the run has actually played to. The engine computes the whole run up
    // front, but stepping or scrubbing past this point would show results the student has not
    // reached yet, so both stop here.
    const [playedUntil, setPlayedUntil] = useState(0);
    const playedUntilRef = useRef(0);

    const playbackIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const lastUpdateTimeRef = useRef(0);
    const playbackTimeRef = useRef(0);
    const isMountedRef = useRef(true);

    const markPlayed = useCallback((time: number) => {
        if (time > playedUntilRef.current) {
            playedUntilRef.current = time;
            setPlayedUntil(time);
        }
    }, []);

    const clearPlayed = useCallback(() => {
        playedUntilRef.current = 0;
        setPlayedUntil(0);
    }, []);

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

    const handleEngineComplete = useCallback((data: TimeSample[]) => {
        if (!isMountedRef.current) return;
        if (data && data.length > 0) {
            playbackTimeRef.current = 0;
            setPlaybackTime(0);
            clearPlayed();
            // Playback starts now either way, so the run is "running" (and can be paused) until the
            // playback loop reaches the end. A run that ended early (shouldStop, e.g. Free Fall
            // hitting the ground) used to be marked "completed" here, which hid the pause button.
            setSimulationStatus('running');
            setIsPlaying(true);
        } else {
            setSimulationStatus('idle');
            setIsPlaying(false);
        }
    }, [clearPlayed]);

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
                markPlayed(currentMaxAvailableTime);
                setIsPlaying(false);
                setSimulationStatus('completed');
                return;
            }

            playbackTimeRef.current = newTime;
            setPlaybackTime(newTime);
            markPlayed(newTime);
        }, 16);

        return () => {
            if (playbackIntervalRef.current) {
                clearInterval(playbackIntervalRef.current);
                playbackIntervalRef.current = null;
            }
        };
    }, [isPlaying, isSimulating, playbackSpeed, getMaxAvailableTime, markPlayed]);

    const startSimulation = useCallback(() => {
        playbackTimeRef.current = 0;
        setPlaybackTime(0);
        clearPlayed();
        setSimulationStatus('calculating');
        setIsPlaying(false);
        engineStartSimulation(parameters, maxSimulationTime);
    }, [parameters, maxSimulationTime, engineStartSimulation, clearPlayed]);

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
        clearPlayed();
        setSimulationStatus('idle');
        engineResetSimulation();
    }, [engineResetSimulation, clearPlayed]);

    const stepForward = useCallback(() => {
        const step = 0.1;
        const limit = Math.min(getMaxAvailableTime(), playedUntilRef.current);
        const newTime = Math.max(playbackTimeRef.current, Math.min(playbackTimeRef.current + step, limit));
        playbackTimeRef.current = newTime;
        setPlaybackTime(newTime);
    }, [getMaxAvailableTime]);

    const stepBackward = useCallback(() => {
        const step = 0.1;
        const newTime = Math.max(playbackTimeRef.current - step, 0);
        playbackTimeRef.current = newTime;
        setPlaybackTime(newTime);
    }, []);

    const scrubSimulation = useCallback((time: number) => {
        const limit = Math.min(getMaxAvailableTime(), playedUntilRef.current);
        const clampedTime = Math.max(0, Math.min(time, limit));
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
        playedUntil,
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
