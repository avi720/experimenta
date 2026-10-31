// קובץ שאחראי על הלוגיקה של מנוע הסימולציה. כלומר, חישוב הנתונים בסימולציה בצעדים קבועים.
import { useState, useCallback, useRef, useEffect } from 'react';
import type { EngineInput, SimulationStepFn, TimeSample } from '@/types/simulation';

// Engines are analytic in t, so a run is sampled on a uniform grid instead of every millisecond (T24).
export const MIN_SAMPLE_DT = 0.001;
export const MAX_SAMPLES = 5000;

/**
 * Sampling interval for a run up to `maxTime`: at most MAX_SAMPLES points, never finer than MIN_SAMPLE_DT,
 * rounded up to a 1-2-5 step so sample times stay readable on chart axes and in exports.
 */
export function getSampleDt(maxTime: number): number {
    if (!(maxTime > 0)) return MIN_SAMPLE_DT;
    const raw = Math.max(MIN_SAMPLE_DT, maxTime / (MAX_SAMPLES - 1));
    const magnitude = 10 ** Math.floor(Math.log10(raw) + 1e-9);
    const step = [1, 2, 5, 10].find((m) => m * magnitude >= raw - 1e-12);
    // A 10× step always covers `raw`, so `find` never comes back empty.
    return Number(((step ?? 10) * magnitude).toPrecision(12));
}

/** Time of grid step `step`, with float noise removed (0.1 * 3 → 0.3). */
const stepTime = (step: number, sampleDt: number): number => Number((step * sampleDt).toPrecision(12));

/**
 * Fills `samples` with the series the workspace runs and then exports.
 * A continued run drops a previous off-grid end point so indices stay `time / sampleDt`.
 * Returns `cancelled` when `control.isCancelled` fires, leaving a partial series in `samples`.
 */
export async function collectSimulationSamples(
    calculateStepFn: SimulationStepFn,
    parameters: EngineInput,
    maxSimulationTime: number,
    sampleDt: number,
    samples: TimeSample[],
    control?: {
        isCancelled?: () => boolean;
        yieldEvery?: number;
        onYield?: () => Promise<void>;
    },
): Promise<'complete' | 'cancelled'> {
    const previousLast = samples[samples.length - 1];
    if (previousLast && Math.abs(previousLast.time / sampleDt - (samples.length - 1)) > 1e-6) {
        samples.pop();
    }

    const lastStep = Math.floor(maxSimulationTime / sampleDt + 1e-9);
    let currentStep = samples.length;
    let yieldCounter = 0;
    const yieldEvery = control?.yieldEvery ?? 0;
    const cancelled = () => control?.isCancelled?.() ?? false;
    let stopped = false;

    while (currentStep <= lastStep && !cancelled()) {
        const dataPoint = calculateStepFn(stepTime(currentStep, sampleDt), parameters);
        samples.push(dataPoint);
        currentStep++;

        if (dataPoint.shouldStop) {
            stopped = true;
            break;
        }

        if (yieldEvery > 0 && ++yieldCounter >= yieldEvery) {
            await control?.onYield?.();
            if (cancelled()) return 'cancelled';
            yieldCounter = 0;
        }
    }

    if (cancelled()) return 'cancelled';

    // End exactly on t_max when it is not a multiple of the sampling interval.
    const lastTime = samples[samples.length - 1]?.time ?? -Infinity;
    if (!stopped && maxSimulationTime - lastTime > 1e-9) {
        samples.push(calculateStepFn(maxSimulationTime, parameters));
    }

    return cancelled() ? 'cancelled' : 'complete';
}

/** O(1) lookup of the sample nearest to `time` on a grid with spacing `sampleDt`. */
export function sampleIndexAtTime(time: number, sampleDt: number, length: number): number {
    if (length === 0) return -1;
    const index = Math.round(Math.max(0, time) / sampleDt);
    return Math.min(length - 1, index);
}

type SimulationEngineLogicOptions = {
    calculateStepFn: SimulationStepFn;
    onSimulationComplete?: (data: TimeSample[]) => void;
};

export function useSimulationEngineLogic({ calculateStepFn, onSimulationComplete }: SimulationEngineLogicOptions) {
    const [isSimulating, setIsSimulating] = useState(false);
    const [simulationData, setSimulationData] = useState<TimeSample[]>([]);
    const shouldStopRef = useRef(false);
    const isMountedRef = useRef(true);
    const runIdRef = useRef(0);
    const runSeedRef = useRef<number | null>(null);
    const sampleDtRef = useRef(MIN_SAMPLE_DT);
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
     * מחשב נתונים בצעדים קבועים (sampleDtRef) עד למקסימום הזמן, ללא חריגה ממנו
     */
    const runEngine = useCallback(async (parameters: EngineInput, maxSimulationTime: number, initialData: TimeSample[] = []) => {
        const currentRunId = ++runIdRef.current;
        shouldStopRef.current = false;
        const tempSimulationData: TimeSample[] = Array.isArray(initialData) ? [...initialData] : [];
        const sampleDt = sampleDtRef.current;

        const isCancelled = () =>
            shouldStopRef.current ||
            !isMountedRef.current ||
            runIdRef.current !== currentRunId;

        try {
            const outcome = await collectSimulationSamples(
                calculateStepFn,
                parameters,
                maxSimulationTime,
                sampleDt,
                tempSimulationData,
                {
                    isCancelled,
                    yieldEvery: 1000,
                    onYield: () => new Promise((resolve) => setTimeout(resolve, 0)),
                },
            );

            if (outcome === 'cancelled' || isCancelled()) {
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

    const startSimulation = useCallback((parameters: EngineInput, maxSimulationTime: number) => {
        if (isSimulating) {
            return;
        }

        const requestedSeed = parameters?.randomSeed;
        const seed =
            typeof requestedSeed === 'number' && !Number.isNaN(requestedSeed)
                ? requestedSeed
                : Math.random();
        runSeedRef.current = seed;
        sampleDtRef.current = getSampleDt(maxSimulationTime);

        setIsSimulating(true);
        setSimulationData([]);

        runEngine(
            { ...parameters, randomSeed: seed },
            maxSimulationTime,
            []
        );
    }, [isSimulating, runEngine]);

    const continueSimulation = useCallback((parameters: EngineInput, toTime: number) => {
        if (isSimulating) return;

        const requestedSeed = parameters?.randomSeed;
        const seed =
            typeof requestedSeed === 'number' && !Number.isNaN(requestedSeed)
                ? requestedSeed
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

    const getDataPointAtTime = useCallback((requestedTime: number): TimeSample | null => {
        if (simulationData.length === 0) {
            return null;
        }

        const index = sampleIndexAtTime(requestedTime, sampleDtRef.current, simulationData.length);
        return simulationData[index];
    }, [simulationData]);

    return {
        isSimulating,
        simulationData,
        startSimulation,
        continueSimulation,
        stopSimulation,
        resetSimulation,
        getMaxAvailableTime,
        getDataPointAtTime
    };
}
