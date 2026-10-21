import React, { useState, useEffect, useCallback } from "react";
import WorkspaceShell from "../components/simulation/workspace/WorkspaceShell";
import DoubleSlitScene from "../components/simulation/scenes/DoubleSlitScene";
import { calculateInterference } from "../components/simulation/engines/doubleSlitEngine";
import { useAppData } from "../components/hooks/useAppData";
import { useExperimentPageData } from "../components/hooks/useExperimentPageData";
import AppLoadingSpinner from '../components/layout/AppLoadingSpinner';

export default function DoubleSlitExperiment() {
  const { settings, user, experiments, isLoading: isAppDataLoading, isRTL, handleLogout } = useAppData();
  // Pass the list only once it has loaded, so an empty catalogue is reported as 'not found' instead of spinning forever.
  const { experiment, isLoading: isExperimentDataLoading } = useExperimentPageData('double-slit', settings, user, isRTL, isAppDataLoading ? undefined : experiments);
  const isPageLoading = isAppDataLoading || isExperimentDataLoading;

    const [parameters, setParameters] = useState({});
    const [simulationData, setSimulationData] = useState([]);
    const [displayedDataPoint, setDisplayedDataPoint] = useState(null);

    const resetExperimentParameters = useCallback(() => {
        if (!experiment) return;

        const defaultParams = {
            wavelength: 500,
            slit_separation: 2000,
            screen_distance: 1,
        };
        if (experiment.parameters) {
            experiment.parameters.forEach(param => {
                defaultParams[param.key] = param.default;
            });
        }
        setParameters(defaultParams);
    }, [experiment]);

    useEffect(() => {
        if (experiment) {
            resetExperimentParameters();
        }
    }, [experiment, resetExperimentParameters]);

    useEffect(() => {
        if (experiment && Object.keys(parameters).length > 0) {
            const pattern = calculateInterference(parameters);
            setSimulationData(pattern);
            setDisplayedDataPoint({ parameters, pattern });
        }
    }, [parameters, experiment]);

    const handleParamChange = useCallback((newParamValues) => {
        setParameters(newParamValues);
    }, []);

        const experimentsByCategory = experiments.reduce((acc, exp) => {
        if (!acc[exp.category]) {
            acc[exp.category] = [];
        }
        acc[exp.category].push(exp);
        return acc;
    }, {});

    if (isPageLoading || !experiment) {
        return <AppLoadingSpinner />;
    }

    const handleNoOp = () => {};

    return (
        <WorkspaceShell
            experiment={experiment}
            user={user}
            settings={settings}
            isRTL={isRTL}
            experimentsByCategory={experimentsByCategory}
            paramValues={parameters}
            onParametersChange={handleParamChange}
            simulationStatus="paused"
            simulationData={simulationData}
            currentTime={0}
            playbackTime={0}
            displayedDataPoint={displayedDataPoint}
            validationState={{}}
            startSimulation={handleNoOp}
            pauseSimulation={handleNoOp}
            resetSimulation={resetExperimentParameters}
            handleStep={handleNoOp}
            handleScrub={handleNoOp}
            applyPreset={(preset) => setParameters(preset.values)}
        >
            <DoubleSlitScene dataPointToRender={displayedDataPoint} />
        </WorkspaceShell>
    );
}