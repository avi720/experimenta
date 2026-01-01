
import React, { useCallback } from "react";
import { useExperimentPageData } from "../components/hooks/useExperimentPageData";
import { useShoSimulation } from "../components/hooks/shoSimulation/useShoSimulation";
import WorkspaceShell from "../components/simulation/workspace/WorkspaceShell";
import ShoScene from "../components/simulation/scenes/ShoScene";
import AppLoadingSpinner from '../components/layout/AppLoadingSpinner';
import { User } from '@/entities/User';

export default function ShoExperiment() {
  const { experiment, settings, user, experiments, isLoading: isPageLoading, isRTL } = useExperimentPageData('sho');

  const {
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
    isAllValid,
    startSimulation,
    pauseSimulation,
    continueSimulation,
    resetSimulation,
    stepForward, // Renamed from handleStep
    stepBackward, // Renamed from handleStepBackward
    scrubTime, // Renamed from handleScrub
    saveRun,
    exportData,
    maxSimulationTime
  } = useShoSimulation(experiment); // user parameter removed as per outline

  console.log('[ShoExperiment] parameters from useShoSimulation:', parameters);
  console.log('[ShoExperiment] t_max:', parameters?.t_max); // Renamed from max_time

  const handleParamChange = useCallback((paramKey, value) => {
    setParameters(prev => ({
      ...prev,
      [paramKey]: value
    }));
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
      user={user}
      experimentsByCategory={experiments}
      isRTL={isRTL}
      parameters={experiment.parameters}
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
      onStep={stepForward} // Updated prop name
      onStepBackward={stepBackward} // Updated prop name
      onScrub={scrubTime} // Updated prop name
      currentTime={currentTime}
      playbackTime={playbackTime}
      simulationData={simulationData}
      onSave={saveRun}
      onExport={exportData}
      canSave={simulationData.length > 0}
      canExport={simulationData.length > 0}
      handleLogout={handleLogout}
      maxSimulationTime={maxSimulationTime}
    >
      <ShoScene parameters={parameters} dataPointToRender={displayedDataPoint} />
    </WorkspaceShell>
  );
}
