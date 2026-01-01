import { useState, useRef, useCallback, useEffect } from 'react';
import { calculateStep } from '../../simulation/engines/shoEngine';

export function useSimulationEngine(parameters, experiment) {
    console.log(`🔧 useSimulationEngine - Hook called`);
    
    const [simulationStatus, setSimulationStatus] = useState('idle');
    const [simulationData, setSimulationData] = useState([]);
    const [currentTime, setCurrentTime] = useState(0);
    
    const animationRef = useRef(null);
    const timeRef = useRef(0);
    const lastTimestampRef = useRef(0);
    const stepAccumulator = useRef(0);

    // Initialize with t=0 data point
    useEffect(() => {
        if (Object.keys(parameters).length > 0) {
            const initialState = calculateStep(0, parameters);
            setSimulationData([initialState]);
            setCurrentTime(0);
        }
    }, [parameters]);

    const runSimulationStep = useCallback((timestamp) => {
        if (simulationStatus !== 'running') {
            return;
        }

        if (!lastTimestampRef.current) {
            lastTimestampRef.current = timestamp;
            animationRef.current = requestAnimationFrame(runSimulationStep);
            return;
        }

        const realDeltaTime = (timestamp - lastTimestampRef.current) / 1000;
        lastTimestampRef.current = timestamp;
        const cappedDeltaTime = Math.min(realDeltaTime, 0.05);
        
        stepAccumulator.current += cappedDeltaTime;

        const fixedTimeStep = 0.002;
        const userDt = parameters.dt || 0.01;

        const newDataBatch = [];
        let shouldStop = false;
        let iterationCount = 0;
        const MAX_ITERATIONS = 100;

        while (stepAccumulator.current >= fixedTimeStep && iterationCount < MAX_ITERATIONS) {
            iterationCount++;
            timeRef.current += fixedTimeStep;
            
            try {
                const latestDataPoint = calculateStep(timeRef.current, parameters);
                const lastSampleTime = simulationData.length > 0 ? simulationData[simulationData.length - 1].time : 0;
                const shouldSample = (timeRef.current - lastSampleTime) >= userDt;

                if (shouldSample && latestDataPoint && typeof latestDataPoint === 'object') {
                    newDataBatch.push(latestDataPoint);
                }

                const MAX_SIMULATION_TIME = 20;
                const hasReachedTimeLimit = timeRef.current >= MAX_SIMULATION_TIME;
                
                if (hasReachedTimeLimit) {
                    setSimulationStatus('ended');
                    shouldStop = true;
                    if (latestDataPoint && (newDataBatch.length === 0 || newDataBatch[newDataBatch.length-1].time < timeRef.current)) {
                        newDataBatch.push(latestDataPoint);
                    }
                    break;
                }
            } catch (error) {
                console.error('Error in calculateStep:', error);
                setSimulationStatus('ended');
                shouldStop = true;
                break;
            }
            
            stepAccumulator.current -= fixedTimeStep;
        }

        if (newDataBatch.length > 0) {
            setSimulationData(prevData => {
                if (!Array.isArray(prevData)) {
                    return [...newDataBatch];
                }
                return [...prevData, ...newDataBatch];
            });
        }
        
        setCurrentTime(timeRef.current);
        
        if (!shouldStop && simulationStatus === 'running') {
            animationRef.current = requestAnimationFrame(runSimulationStep);
        }
    }, [simulationStatus, parameters, simulationData]);

    useEffect(() => {
        if (simulationStatus === 'running') {
            animationRef.current = requestAnimationFrame(runSimulationStep);
        } else if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [simulationStatus, runSimulationStep]);

    const startSimulation = useCallback(() => {
        console.log(`▶️ useSimulationEngine - startSimulation called`);
        if (simulationStatus === 'idle' || simulationStatus === 'ended' || simulationStatus === 'paused') {
            if (simulationStatus === 'idle' || simulationStatus === 'ended') {
                const initialState = calculateStep(0, parameters);
                setSimulationData([initialState]);
                timeRef.current = 0;
                setCurrentTime(0);
                stepAccumulator.current = 0;
                lastTimestampRef.current = 0;
            }
            setSimulationStatus('running');
        }
    }, [simulationStatus, parameters]);

    const pauseSimulation = useCallback(() => {
        console.log(`⏸️ useSimulationEngine - pauseSimulation called`);
        setSimulationStatus('paused');
    }, []);
    
    const resetSimulation = useCallback(() => {
        console.log(`🔄 useSimulationEngine - resetSimulation called`);
        setSimulationStatus('idle');
        const initialState = calculateStep(0, parameters);
        setSimulationData([initialState]);
        timeRef.current = 0;
        setCurrentTime(0);
        stepAccumulator.current = 0;
        lastTimestampRef.current = 0;
    }, [parameters]);

    console.log(`🔧 useSimulationEngine - Returning functions:`, {
        startSimulation: typeof startSimulation,
        pauseSimulation: typeof pauseSimulation,
        resetSimulation: typeof resetSimulation
    });

    return {
        simulationStatus,
        simulationData,
        currentTime,
        startSimulation,
        pauseSimulation,
        resetSimulation,
        timeRef,
        stepAccumulator
    };
}