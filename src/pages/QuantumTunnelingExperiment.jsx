import React, { useCallback } from "react";
import { useExperimentPageData } from "../components/hooks/useExperimentPageData";
import { useQuantumTunnelingSimulation } from "../components/hooks/quantumTunnelingSimulation/useQuantumTunnelingSimulation";
import WorkspaceShell from "../components/simulation/workspace/WorkspaceShell";
import QuantumTunnelingScene from "../components/simulation/scenes/QuantumTunnelingScene";
import AppLoadingSpinner from '../components/layout/AppLoadingSpinner';
import { User } from '@/entities/all';

export default function QuantumTunnelingExperiment() {
  const { experiment, settings, user, experiments, isLoading: isPageLoading, isRTL } = useExperimentPageData('quantum-tunneling');

  const {
    parameters, setParameters, simulationStatus, simulationData, currentTime, playbackTime,
    displayedDataPoint, selectedPreset, initializeParameters, startSimulation, pauseSimulation,
    resetSimulation, handleStep, handleScrub, applyPreset, saveRun, exportData,
    validationState
  } = useQuantumTunnelingSimulation(experiment, user);

  const handleParamChange = useCallback((newParamValues) => {
    setParameters(newParamValues);
  }, [setParameters]);

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