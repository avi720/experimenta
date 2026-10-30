import { useEffect, useMemo, useRef, useState, useCallback, type Dispatch, type SetStateAction } from "react";
import { resolveExperimentRegistryEntry } from "@/simulation/experimentRegistry";
import { validateExperimentParameters } from "@/simulation/parameterValidation";
import { useExperimentParameters } from "./useExperimentParameters";
import { useSimulationManager } from "./useSimulationManager";
import { useExperimentPersistence } from "./useExperimentPersistence";
import { useExperimentChallenge, type ExperimentChallenge } from "./useExperimentChallenge";
import type { LocaleInput } from "@/i18n";
import type { ExperimentTemplateData, ParameterValues, Preset } from "@/types/experiment";
import type { AppUser } from "@/types/models";
import type {
    ExperimentRegistryEntry,
    ParameterValidationState,
    SimulationDataPoint,
    SimulationStatus,
    TimeSample,
} from "@/types/simulation";

const NOOP_STEP = (t: number): TimeSample => ({ time: t, shouldStop: true });

export type ExperimentSimulation = {
    registryEntry: ExperimentRegistryEntry | null;
    parameters: ParameterValues;
    setParameters: Dispatch<SetStateAction<ParameterValues>>;
    selectedPreset: string;
    initializeParameters: () => void;
    applyPreset: (presetKeyOrIndex: string | number | Preset | null | undefined) => void;
    simulationStatus: SimulationStatus;
    simulationData: SimulationDataPoint[];
    currentTime: number;
    playbackTime: number;
    displayedDataPoint: SimulationDataPoint | null;
    validationState: ParameterValidationState;
    maxSimulationTime: number;
    startSimulation: () => void;
    pauseSimulation: () => void;
    continueSimulation: () => void;
    resetSimulation: () => void;
    stepForward: () => void;
    stepBackward: () => void;
    scrubTime: (time: number) => void;
    saveRun: () => Promise<void>;
    exportData: () => void;
    challenge: ExperimentChallenge;
};

/**
 * Single simulation hook driving all experiments via EXPERIMENT_REGISTRY.
 */
export function useExperimentSimulation(
    experiment: ExperimentTemplateData | null | undefined,
    user: AppUser | null | undefined,
    isRTL: LocaleInput = true
): ExperimentSimulation {
    const registryEntry = useMemo(
        () => resolveExperimentRegistryEntry(experiment),
        [experiment]
    );
    const isStaticMode = registryEntry?.mode === "static";

    const {
        parameters,
        setParameters,
        selectedPreset,
        initializeParameters,
        applyPreset,
    } = useExperimentParameters(experiment, registryEntry?.defaultParameters);

    const validationState = useMemo(
        () =>
            validateExperimentParameters(
                experiment?.parameters,
                parameters,
                isRTL
            ),
        [experiment?.parameters, parameters, isRTL]
    );

    const maxSimulationTime = useMemo(() => {
        const fromParam = parseFloat(String(parameters?.t_max));
        if (Number.isFinite(fromParam) && fromParam > 0) {
            return fromParam;
        }
        return registryEntry?.defaultMaxTime ?? 60;
    }, [parameters?.t_max, registryEntry?.defaultMaxTime]);

    const manager = useSimulationManager({
        calculateStepFn: registryEntry?.calculateStepFn || NOOP_STEP,
        parameters,
        maxSimulationTime,
    });
    const {
        startSimulation,
        resetSimulation,
        simulationStatus,
        simulationData: timeSimulationData,
        getDataPointAtTime,
        playbackTime,
    } = manager;

    const guardedStartSimulation = useCallback(() => {
        if (!validationState.isAllValid) {
            return;
        }
        startSimulation();
    }, [validationState.isAllValid, startSimulation]);

    // Clear stale completed/paused time-series results when parameters change after a run.
    const prevParametersRef = useRef<ParameterValues | null>(null);
    useEffect(() => {
        if (isStaticMode) return;
        const prev = prevParametersRef.current;
        const changed =
            prev !== null && JSON.stringify(prev) !== JSON.stringify(parameters);
        prevParametersRef.current = { ...parameters };

        if (
            changed &&
            simulationStatus !== "running" &&
            simulationStatus !== "calculating" &&
            timeSimulationData.length > 0
        ) {
            resetSimulation();
        }
    }, [
        isStaticMode,
        parameters,
        simulationStatus,
        timeSimulationData.length,
        resetSimulation,
    ]);

    // Static mode (e.g. Double Slit) — preserve existing behaviour until OQ 12 is decided.
    const [staticData, setStaticData] = useState<SimulationDataPoint[]>([]);
    const [staticDisplayedPoint, setStaticDisplayedPoint] = useState<SimulationDataPoint | null>(null);

    useEffect(() => {
        if (
            !isStaticMode ||
            !experiment ||
            Object.keys(parameters).length === 0 ||
            !validationState.isAllValid
        ) {
            return;
        }
        const calculateStatic = registryEntry?.calculateStaticFn;
        if (typeof calculateStatic === "function") {
            const pattern = calculateStatic(parameters);
            setStaticData(pattern);
            setStaticDisplayedPoint({ parameters, pattern });
        }
    }, [isStaticMode, experiment, parameters, registryEntry, validationState.isAllValid]);

    const timeDisplayedDataPoint = useMemo(() => {
        if (isStaticMode) return null;
        if (timeSimulationData.length === 0) return null;
        return getDataPointAtTime(playbackTime);
    }, [
        isStaticMode,
        timeSimulationData.length,
        getDataPointAtTime,
        playbackTime,
    ]);

    const simulationData: SimulationDataPoint[] = isStaticMode ? staticData : timeSimulationData;
    const displayedDataPoint = isStaticMode
        ? staticDisplayedPoint
        : timeDisplayedDataPoint;

    const challenge = useExperimentChallenge(experiment, parameters, setParameters);

    const { saveRun, exportData } = useExperimentPersistence(
        experiment,
        user,
        parameters,
        simulationData,
        challenge.runChallenge,
        challenge.hiddenKeys
    );

    const noop = useCallback(() => {}, []);

    if (isStaticMode) {
        return {
            registryEntry,
            parameters,
            setParameters,
            selectedPreset,
            initializeParameters,
            applyPreset,
            simulationStatus: "paused",
            simulationData,
            currentTime: 0,
            playbackTime: 0,
            displayedDataPoint,
            validationState,
            maxSimulationTime: 0,
            startSimulation: noop,
            pauseSimulation: noop,
            continueSimulation: noop,
            resetSimulation: initializeParameters,
            stepForward: noop,
            stepBackward: noop,
            scrubTime: noop,
            saveRun,
            exportData,
            challenge,
        };
    }

    return {
        registryEntry,
        parameters,
        setParameters,
        selectedPreset,
        initializeParameters,
        applyPreset,
        simulationStatus: manager.simulationStatus,
        simulationData: manager.simulationData,
        currentTime: manager.playbackTime,
        playbackTime: manager.playbackTime,
        displayedDataPoint,
        validationState,
        maxSimulationTime,
        startSimulation: guardedStartSimulation,
        pauseSimulation: manager.pauseSimulation,
        continueSimulation: manager.continueSimulation,
        resetSimulation: manager.resetSimulation,
        stepForward: manager.stepForward,
        stepBackward: manager.stepBackward,
        scrubTime: manager.scrubSimulation,
        saveRun,
        exportData,
        challenge,
    };
}
