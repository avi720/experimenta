import React, { useCallback } from "react";
import { useAppData } from "../components/hooks/useAppData";
import { useExperimentPageData } from "../components/hooks/useExperimentPageData";
import { useQuantumTunnelingSimulation } from "../components/hooks/quantumTunnelingSimulation/useQuantumTunnelingSimulation";
import WorkspaceShell from "../components/simulation/workspace/WorkspaceShell";
import QuantumTunnelingScene from "../components/simulation/scenes/QuantumTunnelingScene";
import AppLoadingSpinner from '../components/layout/AppLoadingSpinner';

export default function QuantumTunnelingExperiment() {
  const { settings, user, experiments, isLoading: isAppDataLoading, isRTL, handleLogout } = useAppData();
  // Pass the list only once it has loaded, so an empty catalogue is reported as 'not found' instead of spinning forever.
  const { experiment, isLoading: isExperimentDataLoading } = useExperimentPageData('quantum-tunneling', settings, user, isRTL, isAppDataLoading ? undefined : experiments);
  const isPageLoading = isAppDataLoading || isExperimentDataLoading;

  const {
    parameters, setParameters, simulationStatus, simulationData, currentTime, playbackTime,
    displayedDataPoint, selectedPreset, initializeParameters, startSimulation, pauseSimulation,
    resetSimulation, handleStep, handleScrub, applyPreset, saveRun, exportData,
    validationState
  } = useQuantumTunnelingSimulation(experiment, user);

  const handleParamChange = useCallback((newParamValues) => {
    setParameters(newParamValues);
  }, [setParameters]);

    if (isPageLoading || !experiment) {
    return <AppLoadingSpinner />;
  }

  return (
    <WorkspaceShell
      experiment={experiment}
      settings={settings}
      user={user}
      experiments={experiments}
      paramValues={parameters}
      onParametersChange={handleParamChange}
      simulationStatus={simulationStatus}
      simulationData={simulationData}
      currentTime={currentTime}
      playbackTime={playbackTime}
      displayedDataPoint={displayedDataPoint}
      selectedPreset={selectedPreset}
      validationState={validationState}
      isRTL={isRTL}
      initializeParameters={initializeParameters}
      startSimulation={startSimulation}
      pauseSimulation={pauseSimulation}
      resetSimulation={resetSimulation}
      handleStep={handleStep}
      handleScrub={handleScrub}
      applyPreset={applyPreset}
      saveRun={saveRun}
      exportData={exportData}
      handleLogout={handleLogout}
    >
      <QuantumTunnelingScene parameters={parameters} dataPointToRender={displayedDataPoint} />
    </WorkspaceShell>
  );
}