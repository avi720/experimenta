import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { resolveExperimentRegistryEntry } from "@/components/simulation/experimentRegistry";
import { validateExperimentParameters } from "@/components/simulation/parameters/parameterValidation";
import { useExperimentParameters } from "./useExperimentParameters";
import { useSimulationManager } from "./useSimulationManager";
import { useExperimentPersistence } from "./useExperimentPersistence";

const NOOP_STEP = (t) => ({ time: t, shouldStop: true });

/**
 * Single simulation hook driving all experiments via EXPERIMENT_REGISTRY.
 */
export function useExperimentSimulation(experiment, user, isRTL = true) {
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
        const fromParam = parseFloat(parameters?.t_max);
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
    const prevParametersRef = useRef(null);
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
    const [staticData, setStaticData] = useState([]);
    const [staticDisplayedPoint, setStaticDisplayedPoint] = useState(null);

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

    const simulationData = isStaticMode ? staticData : timeSimulationData;
    const displayedDataPoint = isStaticMode
        ? staticDisplayedPoint
        : timeDisplayedDataPoint;

    const { saveRun, exportData } = useExperimentPersistence(
        experiment,
        user,
        parameters,
        simulationData
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
    };
}
