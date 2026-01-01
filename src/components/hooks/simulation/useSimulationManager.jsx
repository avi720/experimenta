import { useState, useEffect, useRef, useCallback } from 'react';
import { useSimulationEngineLogic } from './useSimulationEngineLogic';

export function useSimulationManager({ 
    calculateStepFn, 
    parameters,
    maxSimulationTime,
    playbackSpeed = 1.0 
}) {
    console.log('[useSimulationManager] initialized with', { 
        parameters, 
        maxSimulationTime, 
        playbackSpeed 
    });

    const [simulationStatus, setSimulationStatus] = useState('idle');
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackTime, setPlaybackTime] = useState(0);

    const playbackIntervalRef = useRef(null);
    const lastUpdateTimeRef = useRef(null);

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
        onSimulationComplete: (data) => {
            console.log('[useSimulationManager] onSimulationComplete', { dataLength: data.length });
            if (data && data.length > 0) {
                const lastPoint = data[data.length - 1];
                if (lastPoint.shouldStop) {
                    setSimulationStatus('completed');
                    setPlaybackTime(0);
                    setIsPlaying(true);
                } else {
                    setSimulationStatus('paused');
                    setIsPlaying(false);
                }
            } else {
                setSimulationStatus('idle');
                setIsPlaying(false);
            }
        }
    });

    useEffect(() => {
        if (!isPlaying || isSimulating) {
            if (playbackIntervalRef.current) {
                clearInterval(playbackIntervalRef.current);
                playbackIntervalRef.current = null;
            }
            return;
        }
        console.log('[useSimulationManager] Playback useEffect active. simulationData length:', simulationData.length);

        const maxAvailableTime = getMaxAvailableTime();
        console.log('[useSimulationManager] Playback useEffect active. maxAvailableTime:', maxAvailableTime);
        if (maxAvailableTime === 0 || playbackTime >= maxAvailableTime) {
            setIsPlaying(false);
            if (playbackTime >= maxAvailableTime && maxAvailableTime > 0) {
                setSimulationStatus('completed');
            }
            return;
        }

        lastUpdateTimeRef.current = Date.now();
        
        playbackIntervalRef.current = setInterval(() => {
            const now = Date.now();
            const dt = (now - lastUpdateTimeRef.current) / 1000;
            lastUpdateTimeRef.current = now;

            setPlaybackTime(prev => {
                const newTime = prev + dt * playbackSpeed;
                const currentMaxAvailableTime = getMaxAvailableTime();
                
                if (newTime >= currentMaxAvailableTime) {
                    setIsPlaying(false);
                    setSimulationStatus('completed');
                    return currentMaxAvailableTime;
                }
                
                return newTime;
            });
        }, 16);

        return () => {
            if (playbackIntervalRef.current) {
                clearInterval(playbackIntervalRef.current);
                playbackIntervalRef.current = null;
            }
        };
    }, [isPlaying, isSimulating, playbackSpeed, getMaxAvailableTime, playbackTime, simulationData.length]);

    const startSimulation = useCallback(() => {
        console.log('[useSimulationManager] startSimulation called', { 
            parameters, 
            maxSimulationTime 
        });
        
        setPlaybackTime(0);
        setSimulationStatus('calculating');
        setIsPlaying(false);
        engineStartSimulation(parameters, maxSimulationTime);
    }, [parameters, maxSimulationTime, engineStartSimulation]);

    const pauseSimulation = useCallback(() => {
        console.log('[useSimulationManager] pauseSimulation called');
        setIsPlaying(false);
        setSimulationStatus('paused');
    }, []);

    const continueSimulation = useCallback(() => {
        console.log('[useSimulationManager] continueSimulation called');
        setIsPlaying(true);
        setSimulationStatus('running');
    }, [playbackTime, maxSimulationTime, parameters, getMaxAvailableTime, engineContinueSimulation]);

    const resetSimulation = useCallback(() => {
        console.log('[useSimulationManager] resetSimulation called');
        setIsPlaying(false);
        setPlaybackTime(0);
        setSimulationStatus('idle');
        engineResetSimulation();
    }, [engineResetSimulation]);

    const stepForward = useCallback(() => {
        const step = 0.1;
        const maxAvailable = getMaxAvailableTime();
        const newTime = Math.min(playbackTime + step, maxAvailable);
        setPlaybackTime(newTime);
    }, [playbackTime, getMaxAvailableTime]);

    const stepBackward = useCallback(() => {
        const step = 0.1;
        const newTime = Math.max(playbackTime - step, 0);
        setPlaybackTime(newTime);
    }, [playbackTime]);

    const scrubSimulation = useCallback((time) => {
        const maxAvailable = getMaxAvailableTime();
        const clampedTime = Math.max(0, Math.min(time, maxAvailable));
        setPlaybackTime(clampedTime);
    }, [getMaxAvailableTime]);

    const stopSimulation = useCallback(() => {
        console.log('[useSimulationManager] stopSimulation called');
        engineStopSimulation();
        setIsPlaying(false);
    }, [engineStopSimulation]);

    const togglePlayback = useCallback(() => {
        console.log('[useSimulationManager] togglePlayback called');
        if (simulationStatus === 'calculating') return; // אי אפשר להפעיל פלייבק בזמן חישוב

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