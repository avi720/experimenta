import React, { useCallback, useMemo } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useAppData } from "../components/hooks/useAppData";
import { useExperimentPageData } from "../components/hooks/useExperimentPageData";
import { useExperimentSimulation } from "../components/hooks/simulation/useExperimentSimulation";
import { resolveExperimentRegistryEntry } from "../components/simulation/experimentRegistry";
import WorkspaceShell from "../components/simulation/workspace/WorkspaceShell";
import AppLoadingSpinner from "../components/layout/AppLoadingSpinner";

export default function LabWorkspace({ forcedSlug = null }) {
    const location = useLocation();
    const params = useParams();

    const resolvedSlug = useMemo(() => {
        if (forcedSlug) return forcedSlug;
        if (params?.slug) return params.slug;

        const searchParams = new URLSearchParams(location.search);
        const fromQuery = searchParams.get("id") || searchParams.get("slug") || searchParams.get("experiment");
        if (fromQuery) return fromQuery;

        if (location.state?.experiment?.slug) {
            return location.state.experiment.slug;
        }

        const pathSegment = location.pathname.replace(/^\/+/, "").split("/")[0];
        const fromPath = resolveExperimentRegistryEntry(pathSegment);
        return fromPath?.slug || null;
    }, [forcedSlug, params?.slug, location.search, location.state, location.pathname]);

    const {
        settings,
        user,
        experiments,
        isLoading: isAppDataLoading,
        isRTL,
        handleLogout,
    } = useAppData();

    const { experiment, isLoading: isExperimentDataLoading } = useExperimentPageData(
        resolvedSlug,
        settings,
        user,
        isRTL,
        isAppDataLoading ? undefined : experiments
    );

    const isPageLoading = isAppDataLoading || isExperimentDataLoading;

    const {
        registryEntry,
        parameters,
        setParameters,
        selectedPreset,
        applyPreset,
        simulationStatus,
        simulationData,
        currentTime,
        playbackTime,
        displayedDataPoint,
        validationState,
        maxSimulationTime,
        startSimulation,
        pauseSimulation,
        continueSimulation,
        resetSimulation,
        stepForward,
        stepBackward,
        scrubTime,
        saveRun,
        exportData,
    } = useExperimentSimulation(experiment, user);

    const handleParamChange = useCallback(
        (keyOrObject, maybeValue) => {
            if (typeof keyOrObject === "string") {
                setParameters((prev) => ({
                    ...prev,
                    [keyOrObject]: maybeValue,
                }));
            } else if (keyOrObject && typeof keyOrObject === "object") {
                setParameters(keyOrObject);
            }
        },
        [setParameters]
    );

    if (isPageLoading || !experiment) {
        return <AppLoadingSpinner />;
    }

    const SceneComponent = registryEntry?.Scene || null;
    const hasCompletedSamples = Array.isArray(simulationData) && simulationData.length > 0;

    return (
        <WorkspaceShell
            experiment={experiment}
            settings={settings}
            user={user}
            experiments={experiments}
            isRTL={isRTL}
            parameters={experiment.parameters || []}
            paramValues={parameters}
            onParameterChange={handleParamChange}
            selectedPreset={selectedPreset}
            onApplyPreset={applyPreset}
            validationState={validationState}
            simulationState={simulationStatus}
            onStart={startSimulation}
            onPause={pauseSimulation}
            onContinue={continueSimulation}
            onReset={resetSimulation}
            onStep={stepForward}
            onStepBackward={stepBackward}
            onScrub={scrubTime}
            currentTime={currentTime}
            playbackTime={playbackTime}
            displayedDataPoint={displayedDataPoint}
            simulationData={simulationData}
            onSave={saveRun}
            onExport={exportData}
            canSave={hasCompletedSamples}
            canExport={hasCompletedSamples}
            handleLogout={handleLogout}
            maxSimulationTime={maxSimulationTime}
        >
            {SceneComponent ? (
                <SceneComponent
                    parameters={parameters}
                    paramValues={parameters}
                    dataPointToRender={displayedDataPoint}
                />
            ) : null}
        </WorkspaceShell>
    );
}
