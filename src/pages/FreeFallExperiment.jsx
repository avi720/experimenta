import React, { useCallback } from "react";
import { useAppData } from "../components/hooks/useAppData";
import { useExperimentPageData } from "../components/hooks/useExperimentPageData";
import { useFreeFallSimulation } from "../components/hooks/freeFallSimulation/useFreeFallSimulation";
import WorkspaceShell from "../components/simulation/workspace/WorkspaceShell";
import FreeFallScene from "../components/simulation/scenes/FreeFallScene";
import AppLoadingSpinner from '../components/layout/AppLoadingSpinner';

export default function FreeFallExperiment() {
  const { settings, user, experiments, isLoading: isAppDataLoading, isRTL } = useAppData();
  const { experiment, isLoading: isExperimentDataLoading  } = useExperimentPageData('free-fall', settings, user, isRTL, experiments);
  const isPageLoading = isAppDataLoading || isExperimentDataLoading; 
  const {
    parameters, setParameters, simulationStatus, simulationData, currentTime, playbackTime,
    displayedDataPoint, selectedPreset, initializeParameters, startSimulation, pauseSimulation,
    resetSimulation, stepForward, stepBackward, scrubTime, applyPreset, saveRun, exportData,
    validationState, continueSimulation
  } = useFreeFallSimulation(experiment, user);

  const handleParamChange = useCallback((newParamValues) => {
    console.log('FreeFallExperiment: Parameter change', newParamValues);
    setParameters(newParamValues);
  }, [setParameters]);

  const handleStart = useCallback(() => {
    console.log('FreeFallExperiment: handleStart called', { 
      simulationStatus, 
      parametersCount: Object.keys(parameters).length,
      parameters 
    });
    startSimulation();
  }, [startSimulation, simulationStatus, parameters]);

  const handlePause = useCallback(() => {
    console.log('FreeFallExperiment: handlePause called');
    pauseSimulation();
  }, [pauseSimulation]);

  const handleContinue = useCallback(() => {
    console.log('FreeFallExperiment: handleContinue called');
    continueSimulation();
  }, [continueSimulation]);

  const handleReset = useCallback(() => {
    console.log('FreeFallExperiment: handleReset called');
    resetSimulation();
  }, [resetSimulation]);

  const handleLogout = async () => {
    try {
      await User.logout();
      window.location.reload();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (isPageLoading || !experiment) {
    return <AppLoadingSpinner />;
  }

//   console.log('FreeFallExperiment: Rendering', {
//     experimentSlug: experiment.slug,
//     parametersInExperiment: experiment.parameters?.length,
//     parametersInState: Object.keys(parameters).length,
//     parameters,
//     displayedDataPoint,
//     simulationStatus
//   });

  return (
    <WorkspaceShell
      experiment={experiment}
      settings={settings}
      user={user}
      experiments={experiments}
      parameters={experiment.parameters || []}
      paramValues={parameters}
      onParameterChange={handleParamChange}
      simulationState={simulationStatus}
      simulationData={simulationData}
      currentTime={currentTime}
      playbackTime={playbackTime}
      displayedDataPoint={displayedDataPoint}
      selectedPreset={selectedPreset}
      validationState={validationState}
      isRTL={isRTL}
      initializeParameters={initializeParameters}
      onStart={handleStart}
      onPause={handlePause}
      onContinue={handleContinue}
      onReset={handleReset}
      onStep={stepForward}
      onStepBackward={stepBackward}
      onScrub={scrubTime}
      applyPreset={applyPreset}
      onSave={saveRun}
      onExport={exportData}
      handleLogout={handleLogout}
      maxSimulationTime={parameters?.t_max || 60}
    >
      <FreeFallScene paramValues={parameters} dataPointToRender={displayedDataPoint} />
    </WorkspaceShell>
  );
}