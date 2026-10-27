// קובץ שאחראי על הלוגיקה של מנוע הסימולציה. כלומר, חישוב הנתונים בסימולציה בצעדים קבועים.
import { useState, useCallback, useRef, useEffect } from 'react';

// קבוע: צעד זמן קבוע עבור מנוע הסימולציה (בשניות)
const FIXED_DT_ENGINE = 0.001;

export function useSimulationEngineLogic({ calculateStepFn, onSimulationComplete }) {
    const [isSimulating, setIsSimulating] = useState(false);
    const [simulationData, setSimulationData] = useState([]);
    const shouldStopRef = useRef(false);
    const isMountedRef = useRef(true);
    const runIdRef = useRef(0);
    const runSeedRef = useRef(null);
    const onCompleteRef = useRef(onSimulationComplete);

    useEffect(() => {
        onCompleteRef.current = onSimulationComplete;
    }, [onSimulationComplete]);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            shouldStopRef.current = true;
            runIdRef.current += 1;
        };
    }, []);

    /**
     * מנהל את ריצת מנוע הסימולציה
     * מחשב נתונים בצעדים קבועים (FIXED_DT_ENGINE) עד למקסימום הזמן
     */
    const runEngine = useCallback(async (parameters, maxSimulationTime, initialData = []) => {
        const currentRunId = ++runIdRef.current;
        shouldStopRef.current = false;
        const tempSimulationData = Array.isArray(initialData) ? [...initialData] : [];

        let currentStep = tempSimulationData.length;
        let currentTime = currentStep * FIXED_DT_ENGINE;
        let yieldCounter = 0;
        const YIELD_EVERY_N_STEPS = 1000;

        const isCancelled = () =>
            shouldStopRef.current ||
            !isMountedRef.current ||
            runIdRef.current !== currentRunId;

        try {
            while (currentTime <= maxSimulationTime && !isCancelled()) {
                currentTime = currentStep * FIXED_DT_ENGINE;
                if (currentTime > maxSimulationTime + 1e-12) {
                    break;
                }

                const dataPoint = calculateStepFn(currentTime, parameters);
                tempSimulationData.push(dataPoint);

                if (dataPoint.shouldStop) {
                    break;
                }

                currentStep++;
                currentTime = currentStep * FIXED_DT_ENGINE;

                if (yieldCounter >= YIELD_EVERY_N_STEPS) {
                    await new Promise(resolve => setTimeout(resolve, 0));
                    if (isCancelled()) {
                        return;
                    }
                    yieldCounter = 0;
                }
                yieldCounter++;
            }

            if (isCancelled()) {
                return;
            }

            setSimulationData(tempSimulationData);
            setIsSimulating(false);
            if (onCompleteRef.current) {
                onCompleteRef.current(tempSimulationData);
            }
        } catch (error) {
            console.error('[useSimulationEngineLogic] Simulation engine error:', error);
            if (isCancelled()) {
                return;
            }
            setSimulationData(tempSimulationData);
            setIsSimulating(false);
            if (onCompleteRef.current) {
                onCompleteRef.current(tempSimulationData);
            }
        }
    }, [calculateStepFn]);

    const startSimulation = useCallback((parameters, maxSimulationTime) => {
        if (isSimulating) {
            return;
        }

        const seed =
            typeof parameters?.randomSeed === 'number' && !Number.isNaN(parameters.randomSeed)
                ? parameters.randomSeed
                : Math.random();
        runSeedRef.current = seed;

        setIsSimulating(true);
        setSimulationData([]);

        runEngine(
            { ...parameters, randomSeed: seed },
            maxSimulationTime,
            []
        );
    }, [isSimulating, runEngine]);

    const continueSimulation = useCallback((parameters, toTime) => {
        if (isSimulating) return;

        const seed =
            typeof parameters?.randomSeed === 'number' && !Number.isNaN(parameters.randomSeed)
                ? parameters.randomSeed
                : runSeedRef.current ?? Math.random();
        runSeedRef.current = seed;

        setIsSimulating(true);

        runEngine(
            { ...parameters, randomSeed: seed },
            toTime,
            simulationData
        );
    }, [isSimulating, runEngine, simulationData]);

    const stopSimulation = useCallback(() => {
        shouldStopRef.current = true;
        runIdRef.current += 1;
        if (isMountedRef.current) {
            setIsSimulating(false);
        }
    }, []);

    const resetSimulation = useCallback(() => {
        shouldStopRef.current = true;
        runIdRef.current += 1;
        runSeedRef.current = null;
        if (isMountedRef.current) {
            setIsSimulating(false);
            setSimulationData([]);
        }
    }, []);

    const getMaxAvailableTime = useCallback(() => {
        if (simulationData.length === 0) return 0;
        return simulationData[simulationData.length - 1].time ?? 0;
    }, [simulationData]);

    const getDataPointAtTime = useCallback((requestedTime) => {
        if (simulationData.length === 0) {
            return null;
        }

        const clampedTime = Math.max(0, Math.min(requestedTime, getMaxAvailableTime()));

        let closestIndex = 0;
        let minDiff = Math.abs(simulationData[0].time - clampedTime);

        for (let i = 1; i < simulationData.length; i++) {
            const diff = Math.abs(simulationData[i].time - clampedTime);
            if (diff < minDiff) {
                minDiff = diff;
                closestIndex = i;
            }
            if (diff > minDiff) {
                break;
            }
        }

        return simulationData[closestIndex];
    }, [simulationData, getMaxAvailableTime]);

    return {
        isSimulating,
        simulationData,
        startSimulation,
        continueSimulation,
        stopSimulation,
        resetSimulation,
        getMaxAvailableTime,
        getDataPointAtTime,
        FIXED_DT_ENGINE
    };
}
