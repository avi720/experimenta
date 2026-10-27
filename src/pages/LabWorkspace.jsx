import React, { useCallback, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Lock, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { useTranslation } from "@/i18n";
import { useAppData } from "../components/hooks/useAppData";
import { useExperimentPageData } from "../components/hooks/useExperimentPageData";
import { useExperimentSimulation } from "../components/hooks/simulation/useExperimentSimulation";
import { resolveExperimentRegistryEntry } from "../components/simulation/experimentRegistry";
import WorkspaceShell from "../components/simulation/workspace/WorkspaceShell";
import AppLoadingSpinner from "../components/layout/AppLoadingSpinner";

export default function LabWorkspace({ forcedSlug = null }) {
    const location = useLocation();
    const navigate = useNavigate();
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
    const { t, pick, dir } = useTranslation(isRTL);

    const {
        experiment,
        blockedExperiment,
        accessDeniedReason,
        isLoading: isExperimentDataLoading,
    } = useExperimentPageData(
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
    } = useExperimentSimulation(experiment, user, isRTL);

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

    if (isPageLoading) {
        return <AppLoadingSpinner />;
    }

    if (accessDeniedReason === "premium") {
        const expTitle = pick(blockedExperiment?.i18n_texts)?.title || blockedExperiment?.slug || "";

        return (
            <div
                className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-16"
                dir={dir}
            >
                <Card className="w-full max-w-md shadow-lg border-amber-200">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-3">
                            <Lock className="w-6 h-6 text-amber-600" />
                        </div>
                        <CardTitle className="text-2xl text-slate-900">
                            {t("workspace.premiumRequiredTitle")}
                        </CardTitle>
                        <CardDescription className="text-base text-slate-600 mt-2">
                            {t("workspace.premiumRequiredDescription", { title: expTitle })}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center pt-2">
                        <Button
                            type="button"
                            onClick={() => navigate(createPageUrl("Lab"))}
                            className="gap-2"
                        >
                            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                            {t("common.backToLab")}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!experiment) {
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
